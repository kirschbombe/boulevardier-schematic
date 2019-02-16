<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei"
    version="1.0">
    
    <xsl:output method="text"/>
    
    <xsl:variable name="quote">"</xsl:variable>
    <xsl:variable name="esc">\"</xsl:variable>
    
    <xsl:template match="/">
        <xsl:text>[</xsl:text>
        <xsl:apply-templates select="//tei:div[@type='images']"/>
        <xsl:text>]</xsl:text>
    </xsl:template>
    
    <xsl:template match="tei:figure">
        <xsl:text>
        {
        </xsl:text>
        <xsl:call-template name="prop">
            <xsl:with-param name="key" select="'id'"/>
            <xsl:with-param name="val" select="substring-after(@xml:id, 'fig')"/>
            <xsl:with-param name="type" select="'number'"/>
        </xsl:call-template>
        <xsl:text>,
        </xsl:text>
        <xsl:call-template name="prop">
            <xsl:with-param name="key" select="'graphic'"/>
            <xsl:with-param name="val" select="concat('assets', substring-after(tei:graphic/@url, '..'))"/>
        </xsl:call-template>
        <xsl:text>,
        </xsl:text>
        <xsl:for-each select="*[local-name(.) != 'graphic']">
            <xsl:call-template name="prop">
                <xsl:with-param name="key" select="local-name()"/>
                <xsl:with-param name="val" select="."/>
            </xsl:call-template>
            <xsl:if test="count(preceding-sibling::*) != 0 and 
                          count(following-sibling::*) != 0
            ">
                <xsl:text>,
        </xsl:text>
            </xsl:if>
        </xsl:for-each>
        <xsl:text>}</xsl:text>
        <xsl:if test="count(following-sibling::*) != 0">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="prop">
        <xsl:param name="key"/>
        <xsl:param name="val"/>
        <xsl:param name="type" select="'string'"/>
        <xsl:value-of select="concat($quote,$key,$quote)"/>
        <xsl:text>: </xsl:text>
        <xsl:choose>
            <xsl:when test="$type = 'string'">
                <xsl:text>"</xsl:text>
                <xsl:call-template name="escape-quote">
                    <xsl:with-param name="s" select="$val"/>
                </xsl:call-template>
                <xsl:text>"</xsl:text>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$val"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="escape-quote">
        <xsl:param name="s"/>
        <xsl:choose>
            <xsl:when test="contains($s, $quote)">
                <xsl:variable name="before" select="substring-before($s, $quote)"/>
                <xsl:variable name="after">
                    <xsl:call-template name="escape-quote">
                        <xsl:with-param name="s" select="substring-after($s, $quote)"/>
                    </xsl:call-template>
                </xsl:variable>
                <xsl:value-of select="concat($before, $esc, $after)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$s"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
</xsl:stylesheet>