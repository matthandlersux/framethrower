<xsl:stylesheet
    xmlns:f="http://www.filmsfolded.com/xsl/ui"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:svg="http://www.w3.org/2000/svg"
	version="1.0">

	<xsl:template match="object">
		<html:div>
			<xsl:call-template name="position">
				<xsl:with-param name="xvar" select="x - 10" />
				<xsl:with-param name="yvar" select="y - 10" />
			</xsl:call-template>
			<xsl:value-of select="id"/>
			<xsl:apply-templates/>
		</html:div>
	</xsl:template>
	
	<xsl:template match="*">
		<html:div>
			<!--
			<xsl:value-of  select="name()"/>: <xsl:apply-templates/>
			!-->
		</html:div>
	</xsl:template>
	
	<xsl:template name="position">
		<xsl:param name="xvar" />
		<xsl:param name="yvar" />
		<xsl:attribute name="style">
			<xsl:value-of select="'position: absolute;'" />
			<!--
			<xsl:value-of select="concat('position: absolute; left: ', $xvar, 'px; top: ', $yvar, 'px;')" />
			!-->
		</xsl:attribute>
	</xsl:template>
</xsl:stylesheet>