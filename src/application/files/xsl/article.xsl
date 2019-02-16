<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei"
    version="1.0">

    <xsl:output method="html" encoding="UTF-8"/>
    <!-- <xsl:strip-space elements="*"/> -->
    <xsl:preserve-space elements="p div span"/>

    <!-- id value for article -->
    <xsl:param name="article-id"/>
    
    <!-- relative path to icon file -->
    <xsl:param name="icon-path"/>

    <xsl:template name="check-params">
        <xsl:if test="$article-id = ''">
            <xsl:message terminate="yes">Id parameter must be non-empty.</xsl:message>
        </xsl:if>
        <xsl:if test="$icon-path = ''">
            <xsl:message terminate="yes">Icon urls parameter must be non-empty.</xsl:message>
        </xsl:if>        
    </xsl:template>

    <xsl:template match="/">
        <xsl:call-template name="check-params"/>
        
        <article id="{$article-id}" class="before-footer article-content">
            <header class="header">
                <xsl:call-template name="header"/>
            </header>
            <section id="body">
                <xsl:call-template name="body"/>
                <xsl:apply-templates select="//tei:back/tei:div[@type='bibliography']"/>
            </section>
        </article>
    </xsl:template>

    <xsl:template match="tei:ref">
        <a href="{@target}">
            <xsl:apply-templates/>
        </a>
    </xsl:template>


<!--
-/- header templates
-->

    <xsl:template name="header">
        <p class="heading"><xsl:call-template name="handle-note"/></p>
        <h1 class="article-title">
            <xsl:apply-templates select="//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title"/>
            <span ng-click="onBodyMarkerClick()">
            <img class="article-marker" src="{$icon-path}"></img>
            </span>
        </h1>
        <p class="byline"><xsl:call-template name="handle-byline"/>
            <xsl:text> </xsl:text>
            <xsl:call-template name="handle-date"/>
        </p>
    </xsl:template>

    <xsl:template name="handle-note">
        <span><xsl:value-of select="//tei:teiHeader/tei:fileDesc/tei:notesStmt/tei:relatedItem/tei:bibl/tei:author"/> </span>
        <xsl:text> </xsl:text>
        <span><xsl:value-of select="//tei:teiHeader/tei:fileDesc/tei:notesStmt/tei:relatedItem/tei:bibl/tei:title"/></span>
    </xsl:template>

    <xsl:template name="handle-byline">
        <xsl:variable name="count" select="count(//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:author)"/>
        <xsl:for-each select="//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:author">
            <xsl:choose>
                <xsl:when test="position() = 1">
                    <span><xsl:value-of select="."/></span>
                </xsl:when>
                <xsl:when test="position() != 1">
                    <span>, <xsl:value-of select="."/></span>
                </xsl:when>
            </xsl:choose>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="handle-date">
        <span>(<xsl:value-of select="//tei:teiHeader/tei:fileDesc/tei:publicationStmt/tei:date"/>)</span>
    </xsl:template>

<!--
-/- body templates
-->

    <xsl:template name="body">
        <xsl:apply-templates select="//tei:body"/>
    </xsl:template>

    <xsl:template match="tei:div|tei:p">
        <xsl:element name="{local-name()}">
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="tei:div[@type='bibliography']">
        <xsl:if test="tei:listBibl/tei:bibl/text()">
            <div>
                <h6>Works Cited</h6>
                <xsl:apply-templates/>
            </div>
        </xsl:if>
    </xsl:template>

    <xsl:template match="tei:emph">
        <em>
            <xsl:apply-templates/>
        </em>
    </xsl:template>

    <xsl:template match="tei:q">
        <div class="pullquote">
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <xsl:template match="tei:bibl">
        <div class="bibl">
            <xsl:apply-templates/>
        </div>
    </xsl:template>

</xsl:stylesheet>
