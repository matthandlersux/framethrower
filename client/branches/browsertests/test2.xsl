<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:f="http://www.filmsfolded.com/xsl/ui">
	
	<xsl:template match="*">
		<xsl:copy>
			<xsl:copy-of select="@*[local-name() != 'type']" />
			<xsl:apply-templates select="node()" />
		</xsl:copy>
		<xsl:if test="@type">
			<infon relation="ofType">
				<arc role="type" arg="{@type}" />
				<arc role="instance" arg="{@name}" />
			</infon>
		</xsl:if>
	</xsl:template>
	
</xsl:stylesheet>