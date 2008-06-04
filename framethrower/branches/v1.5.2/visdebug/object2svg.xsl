<xsl:stylesheet
    xmlns:f="http://www.filmsfolded.com/xsl/ui"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:svg="http://www.w3.org/2000/svg"
	version="1.0">
	
	<xsl:template match="object">
		<xsl:variable name="x" select="x"/>
		<xsl:variable name="y" select="y"/>
	    <svg:circle r="20" fill="url(#gradient)">
	    	<!--
	    	<xsl:attribute name="cx">
				<xsl:value-of select="x" />
			</xsl:attribute>
	    	<xsl:attribute name="cy">
				<xsl:value-of select="y" />
			</xsl:attribute>
			!-->
	    </svg:circle>
	</xsl:template>

	<xsl:template match="link">
		<!--
	    <svg:circle r="20" fill="url(#gradient)">
	    	<xsl:attribute name="cx">
				<xsl:value-of select="x" />
			</xsl:attribute>
	    	<xsl:attribute name="cy">
				<xsl:value-of select="y" />
			</xsl:attribute>			
	    </svg:circle>
		!-->
		<svg:path d="M200,300 Q400,50 600,300 T1000,300"
        fill="none" stroke="red" stroke-width="5"  />
		
	</xsl:template>
	
</xsl:stylesheet>