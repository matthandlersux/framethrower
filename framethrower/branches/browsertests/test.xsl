<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:f="http://www.filmsfolded.com/xsl/ui">

	<xsl:param name="parentSituation" />
	<xsl:template match="*">
		<transaction>
			<f:perform url="helper/makeobject.xml" prefix="obj">
				<f:with-param name="type"><f:string value="kernel.situation" /></f:with-param>
				<f:with-param name="parentSituation" id="{$parentSituation/@id}" />
			</f:perform>
			<f:return as="o" value-var="obj.o" />
		</transaction>
	</xsl:template>
</xsl:stylesheet>