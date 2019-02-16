
import {
    Rule, SchematicContext, SchematicsException, Tree, mergeWith,
    apply, url, move, MergeStrategy, chain, template
} from '@angular-devkit/schematics';
import { addPackageJsonDependency, NodeDependencyType, NodeDependency } from '@schematics/angular/utility/dependencies';
import { findPropertyInAstObject } from '@schematics/angular/utility/json-utils';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';

import * as fs from 'fs';
import * as child_process from 'child_process';

const which = require('which');

import { Schema as ApplicationOptions } from './schema';
import { getSystemPath, normalize, JsonParseMode, parseJsonAst, JsonAstObject } from '@angular-devkit/core';
import { dasherize } from '@angular-devkit/core/src/utils/strings';

// XPath constants
const teiTitleText: string  = '//TEI:title/text()'
const teiNS = {TEI: 'http://www.tei-c.org/ns/1.0'};

const xmlMime = "text/xml";
const htmlMime = "text/html";
const teiPlacenameXPath = '//TEI:back/TEI:note[@type="mapmarker"]/TEI:placeName/@type';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function application(options: ApplicationOptions): Rule {

    return (tree: Tree, context: SchematicContext) => {

        const assetsDirectory: PathString = validateOptions(options);

        const articlesDir   = n(`${ assetsDirectory.s }/articles`);
        const configDir     = n(`${ assetsDirectory.s }/config`);
        const imagesDir     = n(`${ assetsDirectory.s }/images`);
        const pagesDir      = n(`${ assetsDirectory.s }/pages`);
        const iconsDir      = n(`${ assetsDirectory.s }/icons`);
        const fontsDir      = n(`${ assetsDirectory.s }/fonts`);
        const titleDir      = n(`${ assetsDirectory.s }/title`);

        const sitesourceDir         = n(`src`);
        const siteAssetsDirectory   = n(`src/assets`);
        const configSiteDir         = n(`${ siteAssetsDirectory.s }/config`);
        const iconsSiteDirectory    = n(`${ siteAssetsDirectory.s }/icons`);
        const fontsSiteDirectory    = n(`${ siteAssetsDirectory.s }/fonts`);
        const imagesSiteDirectory   = n(`${ siteAssetsDirectory.s }/images`);
        const pagesSiteDirectory    = n(`${ siteAssetsDirectory.s }/pages`);
        const titleSiteDirectory    = n(`${ siteAssetsDirectory.s }/title`);

        const angularJsonPath = n(`${__dirname}/files/angular.json`);
        const readmePath      = n(`${__dirname}/files/README.md`);

        let rules: Rule[] = [
          handleSrcCopy('./files/src', articlesDir, pagesDir, sitesourceDir)    // copy base application src files
        , doFileCopy(angularJsonPath, n('angular.json'))                        // copy angular.json file
        , doFileCopy(readmePath, n('README.md'))                                // copy README file
        , copyContents(configDir, configSiteDir)                                // copy site configuration files
        , copyContents(iconsDir, iconsSiteDirectory)                            // copy icon files
        , copyContents(fontsDir, fontsSiteDirectory)                            // copy font files
        , copyContents(imagesDir, imagesSiteDirectory)                          // copy image files
        , copyContents(pagesDir, pagesSiteDirectory)                            // copy page files
        , copyContents(titleDir, titleSiteDirectory)                            // copy page files
        , handleArticles(articlesDir, iconsDir, siteAssetsDirectory)            // transform article xml
        , handleSiteConfig(articlesDir, pagesDir, siteAssetsDirectory)          // generate a site config file

        , updatePackageDependencies()                                           // update package.json
        ];
        context.addTask(new NodePackageInstallTask());                          // install npm dependencies

       return chain(rules)(tree, context);
    };
}

/**
 * Copy over a file directly.
 *
 * @param from
 * @param to
 */
function doFileCopy(from: PathString, to: PathString): Rule {
    return (tree) => {
        const buffer = fs.readFileSync(from.s);
        if (buffer === null) {
            throw new SchematicsException(`Failed to read file '${ from.s }'`);
        }
        if (tree.exists(to.s)) {
            tree.overwrite(to.s, buffer);
        } else {
            tree.create(to.s, buffer);
        }
    };
}

/**
 * Read dependencies from the local package.json file an add to the project package.json file.
 */
function updatePackageDependencies(): Rule {
    return (tree) => {
        const buffer = fs.readFileSync(n(`${ __dirname }/files/package.json`).s);
        if (buffer === null) {
            throw new SchematicsException(`Failed to read './files/package.json'`);
        }
        const content = buffer.toString();
        const packageJson = parseJsonAst(content, JsonParseMode.Strict);
        if (packageJson.kind != 'object') {
            throw new SchematicsException(`Failed to parse './files/package.json'`);
        }
        const depsNode = findPropertyInAstObject(packageJson, NodeDependencyType.Default);
        if (! depsNode) {
            throw new SchematicsException(`Failed to find dependencies in './files/package.json'`);
        }
        const devDepsNode = findPropertyInAstObject(packageJson, NodeDependencyType.Dev);
        if (! devDepsNode) {
            throw new SchematicsException(`Failed to find devDependencies in './files/package.json'`);
        }
        const depsObject: JsonAstObject = <JsonAstObject>depsNode;
        const devDepsObject: JsonAstObject = <JsonAstObject>devDepsNode;

        const addDep = (name: string, version: string, type: NodeDependencyType) => {
            name =       name.replace(/^"|"$/g, "");
            version = version.replace(/^"|"$/g, "");
            const nodeDependency: NodeDependency = {
                type, name, version, overwrite: true
            };
            try {
                addPackageJsonDependency(tree, nodeDependency);
            } catch (e) {
                throw new SchematicsException(`Failed to add dependency ${name} ${version}: ${ e.toString() }`);
            }
        }
           depsObject.properties.forEach(dep => addDep(dep.key.text, dep.value.text, NodeDependencyType.Default));
        devDepsObject.properties.forEach(dep => addDep(dep.key.text, dep.value.text, NodeDependencyType.Dev));
        return tree;
    };
}

/**
 * Validate the command line options. Other checks:
 *
 *      - verify that `xsltproc` is available on the system
 *
 * @param options
 */
function validateOptions(options: ApplicationOptions): PathString {
    if (options.assetsDirectory === undefined) {
        throw new SchematicsException(`Invalid options, "assetsDirectory" is required.`);
    }
    const assetsDirectory = n(`${ process.cwd() }/${ options.assetsDirectory }`);

    if (! fs.existsSync(assetsDirectory.s)) {
        throw new SchematicsException(`Invalid options, "assetsDirectory" must exist: ${ assetsDirectory.s }`);
    }
    try {
        which.sync('xsltproc');
    } catch (e) {
        throw new SchematicsException(`Could not find an installation of xsltproc`);
    }

    return assetsDirectory;
}

/**
 * Normalize a string representation of a path and return as a PathString containing
 * the executing system's version of the path.
 *
 * All strings representing paths in this schematic use Unix-style separators for consistency.
 *
 * @param str
 */
function n(str: string): PathString {
    return {
        s: normalize(str).toString()
        , toString: pathStringFail
    };
}

/**
 * Cause runtime exception if an implicit toString() call occurs.
 */
function pathStringFail(): never {
    throw new SchematicsException('Implicit toString() called on PathString.');
}

/**
 * Type to ensure that all paths are normalized.
 */
interface PathString {
    s: string;
    toString(): never;
}

/**
 * Copy files with the given URL (local to this schematic) to the target site directory.
 *
 * @param sourceRoot
 */
function handleSrcCopy(localUrl: string, articlesDir: PathString, pagesDir: PathString, targetRoot: PathString): Rule {

    // template for `articleBodySwitch` in article.component.html
    const bodySwitchCaseFormat = (id: string, n: number) =>
    `<div *ngSwitchCase="'${id}'">
        <app-body-${n} (iconClickEmitter)="onArticleMarkerClick($event)"></app-body-${n}>
	</div>
    `;

    // template for `bodyComponents` in article-body.component.html
    const articleBodyComponentFormat = (id: string, n: number) =>
    `@Component({
        selector: 'app-body-${n}',
        templateUrl: '../../assets/articles/${id}/article.html'
    })
    export class Body${n}Component extends BodyComponentBase {
        id = "${id}";
    }
    `;

    // template for `bodyComponentList` in app.module.ts
    const bodyComponentListFormat = (n: number) => `Body${n}Component`;

    // template for `pageComponents` in page.component.ts
    const pageComponentFormat = (file: string, n: number) =>
    `@Component({
        selector: 'app-page-${n}',
        templateUrl: '../../assets/pages/${file}'
    })
    export class Page${n}Component { }
    `;

    // template for `pageSwitch` in page.component.html
    const pageSwitchCaseFormat = (id: string, n: number) =>
    `<div *ngSwitchCase="'${id}'">
        <app-page-${n}></app-page-${n}>
    </div>
    `;

    const pageComponentListFormat = (n: number) => `Page${n}Component`;

    const articleTitles: string[] =
        fs.readdirSync(articlesDir.s).map(a => n(`${articlesDir.s}/${a}`))
        .map((inputPath: PathString) => dasherize(evaluateTeiXpath(inputPath, teiTitleText)));

    const articleBodySwitch = articleTitles.map(bodySwitchCaseFormat).join("\n");
    const bodyComponents    = articleTitles.map(articleBodyComponentFormat).join("\n");
    const bodyComponentList = articleTitles.map((_, n) => bodyComponentListFormat(n)).join(",\n    ");

    const pageFiles: string[] = fs.readdirSync(pagesDir.s);
    const pageTitles: string[] =
        fs.readdirSync(pagesDir.s).map(p => n(`${pagesDir.s}/${p}`))
        .map((inputPath: PathString) => dasherize(getHtmlTitle(inputPath, 'h1')));

    const pageComponents = pageFiles.map(pageComponentFormat).join("\n");
    const pageSwitchCases = pageTitles.map(pageSwitchCaseFormat).join("\n");
    const pageComponentList = pageTitles.map((_, n) => pageComponentListFormat(n)).join(",\n    ");

    const copySrc = mergeWith(
        apply(
            url(localUrl),
            [template({
                articleBodySwitch
              , bodyComponents
              , bodyComponentList
              , pageComponents
              , pageSwitchCases
              , pageComponentList
            })
            , move(targetRoot.s)]
        ),
        MergeStrategy.AllowCreationConflict
    );
    return copySrc;
}

/**
 * Copy the contenst of the source directory to the destination directory.
 *
 * @param sourceDir
 * @param destDir
 */
function copyContents(sourceDir: PathString, destDir: PathString): Rule {

    const isNotDirectory = (file: string): boolean => {
        const path: PathString = n(`${sourceDir.s}/${ file }`);
        return ! fs.statSync(path.s).isDirectory();
    };

    type CopyPath = { source: PathString; dest: PathString };
    const paths: CopyPath[] =
        fs.readdirSync(sourceDir.s).filter(isNotDirectory)
        .map((sourceFile: string) => {
            return {
                source: n(`${sourceDir.s}/${sourceFile}`)
                , dest: n(`${destDir.s}/${sourceFile}`)
            };
        });

    return (tree) => {
        paths.forEach((path: CopyPath) => {
            let content: Buffer | null = null;
            try {
                content = fs.readFileSync(path.source.s);
            } catch (e) {
                throw new SchematicsException(`Failed to find source file '${ path }': ${ e.toString() }`);
            }
            if (content === null) {
                throw new SchematicsException(`Failed to read file at source path: ${ path.source }`);
            }
            tree.create(path.dest.s, content);
        });
        return tree;
    }
}

/**
 * Generate a site configuration file with article and page info.
 *
 * @param articlesDir
 * @param pagesDir
 * @param siteAppMenuDir
 */
function handleSiteConfig(articlesDir: PathString, pagesDir: PathString, siteAssetsDirectory: PathString): Rule {

    type MenuItem = { id: string, routerLink: string; title: string };

    const articles: PathString[] = fs.readdirSync(articlesDir.s)
        .map((a: string) => n(`${articlesDir.s}/${a}`));

    const articleItems: MenuItem[] = articles.map((path: PathString) => {
        const title: string = evaluateTeiXpath(path, teiTitleText);
        const id = dasherize(title);
        return {
            id, title, routerLink: `/article/${ id }`
        };
    });

    const pages: PathString[] = fs.readdirSync(pagesDir.s).map(a => n(`${pagesDir.s}/${a}`));
    const pageItems: MenuItem[] = pages.map((page) => {
        const title: string = getHtmlTitle(page, 'h1');
        const id = dasherize(title);
        return {
            id, title, routerLink: `/page/${ id }`
        };
    });

    const siteConfigFilePath = n(`${siteAssetsDirectory.s}/config/site.json`);
    const content = JSON.stringify({
        pages: pageItems,
        articles: articleItems
    }, null, 4);

    return (tree) => {
        tree.create(siteConfigFilePath.s, content);
    }
}

/**
 * For each article in the assets directory, generate the following site asset files:
 *
 *      - {site}/src/assets/{article title}/article.html
 *      - {site}/src/assets/{article title}/cited-range.json
 *      - {site}/src/assets/{article title}/geojson.json
 *      - {site}/src/assets/{article title}/images.json
 *
 * @param articlesDir
 * @param iconsDir
 * @param siteAssetsDirectory
 */
function handleArticles(articlesDir: PathString, iconsDir: PathString, siteAssetsDirectory: PathString): Rule {

    const articles: PathString[] = fs.readdirSync(articlesDir.s).map(a => n(`${articlesDir.s}/${a}`));

    // relative path from article.html to icon
    const icons: PathString[] = fs.readdirSync(iconsDir.s).map(a => n(`assets/icons/${a}`));
    let iconInd = 0;
    function* iconGen(): any {
        if (iconInd >= icons.length) {
            iconInd = 0;
        }
        yield icons[iconInd++];
    }

    // xsl stylesheets in this schematics project
    const articleStylesheet    = n(`${ __dirname }/files/xsl/article.xsl`);
    const citedRangeStylesheet = n(`${ __dirname }/files/xsl/cited-range.xsl`);
    const geoJsonStylesheet    = n(`${ __dirname }/files/xsl/geojson.xsl`);
    const imagesStylesheet     = n(`${ __dirname }/files/xsl/images.xsl`);

    // xslt cannot produce invalid xml, so replace this attribute
    const articleCB = function(content: string): string {
        return content.replace('ng-click', '(click)');
    }
    const id = (x: string) => x;

    // choose an icon according to the map marker placename type
    let iconMap: { [key:string]: PathString } = {};
    const iconPicker = function(mapMarkerText: string): PathString {
        if (! iconMap[mapMarkerText]) {
            iconMap[mapMarkerText] = iconGen().next().value;
        }
        return iconMap[mapMarkerText];
    }

    const rules: Rule[] = articles.map((inputPath: PathString) => {

        const title = dasherize(evaluateTeiXpath(inputPath, teiTitleText));
        const outputDir = n(`${ siteAssetsDirectory.s }/articles/${ title }`);

        const articleHtmlPath   = n(`${outputDir.s}/article.html`);
        const citedJsonPath     = n(`${outputDir.s}/cited-range.json`);
        const geoJsonPath       = n(`${outputDir.s}/geojson.json`);
        const imagesJsonPath    = n(`${outputDir.s}/images.json`);

        const mapMarkerText = evaluateTeiXpath(inputPath, teiPlacenameXPath);

        const iconUrl = iconPicker(mapMarkerText).s;

        // handle stylesheet params
        const articleParams = `--stringparam 'article-id' '${ title }' --stringparam 'icon-path' '${ iconUrl }'`;
        const geojsonParmas = `--stringparam 'iconUrl' '${ iconUrl }'`;

        return chain(
        [ transform(articleStylesheet,    inputPath, articleHtmlPath, articleCB, articleParams)
        , transform(citedRangeStylesheet, inputPath, citedJsonPath,   id, '')
        , transform(geoJsonStylesheet,    inputPath, geoJsonPath,     id, geojsonParmas)
        , transform(imagesStylesheet,     inputPath, imagesJsonPath,  id, '')
        ]);
    });
    return chain(rules);
}
/**
 * Return the text content of the first XPath match at the given file.
 *
 * @param parser
 * @param path
 */
function evaluateTeiXpath(filePath: PathString, xpathExpression: string): string {
    const doc: Document = xmlParse(filePath, xmlMime);
    const select = xpath.useNamespaces(teiNS);
    const result: xpath.SelectedValue[] = select(xpathExpression, doc);
    if (result === undefined || result.length === 0) {
        throw new SchematicsException(`Failed to evaluate XPath '${xpathExpression}' for file '${ filePath.s }'`);
    }
    return result[0].toString().trim();
}

function getHtmlTitle(path: PathString, element: string): string {
    const doc: Document = xmlParse(path, htmlMime);
    const title: any = doc.getElementsByTagName(element);
    if (title === null || title.length === 0) {
        throw new SchematicsException(`Invalid HTML file, no title: ${ path }`);
    }
    return title[0].textContent.trim();
}

/**
 * Perform XSLT transform using the system `xsltproc` installation, post-processing the string output with the given callback.
 *
 * @param parser
 * @param proc
 * @param xmlInputPath
 * @param outputPath
 * @param cb
 */
function transform(styleSheetPath: PathString, xmlInputPath: PathString, outputPath: PathString, cb: (s:string) => string, params: string): Rule {
    const cmd: string = `xsltproc ${ params } -o - '${ styleSheetPath.s }' '${ xmlInputPath.s }'`
    let resultStr: string;
    try {
        resultStr = cb(child_process.execSync(cmd).toString());
    } catch (e) {
        throw new SchematicsException(`Failed to execute xsltproc: ${ e.toString() }`);
    }
    if (resultStr === undefined || resultStr === null || resultStr.length == 0) {
        throw new SchematicsException(`Empty document returned by xsltproc for file '${ xmlInputPath }'`);
    }
    return (tree: Tree) => {
        tree.create(outputPath.s, resultStr);
        return tree;
    }
}

/**
 *
 *
 * @param xmlPath
 * @param mime
 */
function xmlParse(path: PathString, mime: string): Document {
    let parser: DOMParser = new DOMParser();
    let normPath = getSystemPath(normalize(path.s));
    if (! fs.existsSync(normPath)) {
        throw new SchematicsException(`File for xml input does not exist: ${ normPath }`);
    }
    const docStr: string = fs.readFileSync(normPath).toString();
    return parser.parseFromString(docStr, mime);
}

