<xsl:stylesheet
	xmlns:f="http://www.filmsfolded.com/xsl/ui"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:svg="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	version="1.0">
	
	<xsl:param name="typeShapes" />

	<xsl:template match="object">
		<xsl:variable name="typevar" select="@type" />
		<xsl:variable name="typeinfo" select="$typeShapes/typeinfo[@type = $typevar]"/>
		<answer>
			<xsl:attribute name="shape">
				<xsl:value-of select="$typeinfo/@shape"/>
			</xsl:attribute>
			<xsl:attribute name="cssclass">
				<xsl:value-of select="$typeinfo/@class"/>
			</xsl:attribute>
			
		</answer>
	</xsl:template>

</xsl:stylesheet>