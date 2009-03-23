<xsl:stylesheet
    xmlns:f="http://www.filmsfolded.com/xsl/ui"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:svg="http://www.w3.org/2000/svg"
	version="1.0">
	
	<xsl:template match="objects">
		<html:div>
		<svg:svg version="1.1"
		    id="svgelement"
		    preserveAspectRatio="xMidYMid slice"
		    style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:-1;">
			<svg:linearGradient id="gradient">
				<svg:stop class="begin" offset="0%"/>
				<svg:stop class="end" offset="100%"/>
	    	</svg:linearGradient>
		    <svg:rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" />
			<xsl:apply-templates mode="svg"/>
		</svg:svg>
		<html:div>
			<xsl:apply-templates mode="html"/>
		</html:div>
		</html:div>
	</xsl:template>

	<xsl:template mode = "svg" match="objects/object">
		<xsl:variable name="x" select="x"/>
		<xsl:variable name="y" select="y"/>
	    <svg:circle cx="{$x}" cy="{$y}" r="20"
    	 fill="url(#gradient)" />
	</xsl:template>
	
	<xsl:template mode = "html" match="objects/object">
		<xsl:variable name="name" select="name"/>
		<html:div>
			<xsl:call-template name="position">
				<xsl:with-param name="xvar" select="x - 10" />
				<xsl:with-param name="yvar" select="y - 10" />
			</xsl:call-template>
			<xsl:value-of select="name"/>
		</html:div>
	</xsl:template>	
	
	<xsl:template name="position">
		<xsl:param name="xvar" />
		<xsl:param name="yvar" />
		<xsl:attribute name="style">
			<xsl:value-of select="concat('position: absolute; left: ', $xvar, 'px; top: ', $yvar, 'px;')" />
		</xsl:attribute>
	</xsl:template>
</xsl:stylesheet>