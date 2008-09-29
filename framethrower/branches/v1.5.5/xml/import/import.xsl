<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:f="http://www.filmsfolded.com/xsl/ui">
	
	<xsl:template match="*">
		<transaction>
			<xsl:apply-templates select="." mode="print" />
			<xsl:for-each select="//*[@returnas]">
				<f:return as="{@returnas}">
					<xsl:attribute name="value-var">
						<xsl:call-template name="getName" />
						<xsl:text>.o</xsl:text>
					</xsl:attribute>
				</f:return>
			</xsl:for-each>
		</transaction>
	</xsl:template>
	
	<xsl:template match="situation" mode="print">
		<f:perform url="makeSituation.xml">
			<xsl:call-template name="prefixName" />
			<xsl:call-template name="parentSituation" />
		</f:perform>
		<xsl:apply-templates mode="print" />
	</xsl:template>
	
	<xsl:template match="individual" mode="print">
		<f:perform url="makeIndividual.xml">
			<xsl:call-template name="prefixName" />
			<xsl:call-template name="parentSituation" />
		</f:perform>		
		<xsl:apply-templates mode="print" />
	</xsl:template>
	
	<xsl:template match="relation" mode="print">
		<f:perform url="makeRelation.xml">
			<xsl:call-template name="prefixName" />
			<xsl:call-template name="parentSituation" />
		</f:perform>
		<xsl:apply-templates mode="print" />
	</xsl:template>
	
	<xsl:template match="infon" mode="print">
		<f:perform url="makeInfon.xml">
			<xsl:call-template name="prefixName" />
			<xsl:call-template name="parentSituation" />
			<f:with-param name="relation" value-var="{concat(@relation, '.o')}" />
			<f:with-param name="arcs">
				<f:assoc>
					<xsl:for-each select="arc">
						<f:pair>
							<f:key><f:string value="{@role}" /></f:key>
							<f:value><f:ob var="{concat(@arg, '.o')}" /></f:value>
						</f:pair>
					</xsl:for-each>
				</f:assoc>
			</f:with-param>
		</f:perform>
		<xsl:apply-templates mode="print" />
	</xsl:template>
	
	<xsl:template match="content" mode="print">
		<f:perform url="modifyContent.xml">
			<f:with-param name="object">
				<xsl:attribute name="value-var">
					<xsl:call-template name="getName">
						<xsl:with-param name="focus" select="parent::*" />
					</xsl:call-template>
					<xsl:text>.o</xsl:text>
				</xsl:attribute>
			</f:with-param>
			<f:with-param name="content">
				<xsl:choose>
					<xsl:when test="*">
						<xsl:copy-of select="*" />
					</xsl:when>
					<xsl:otherwise>
						<f:string value="{.}" />
					</xsl:otherwise>
				</xsl:choose>
			</f:with-param>
		</f:perform>
	</xsl:template>
	
	
	
	
	<xsl:template name="prefixName">
		<xsl:attribute name="prefix">
			<xsl:call-template name="getName" />
		</xsl:attribute>
	</xsl:template>
	
	<xsl:template name="parentSituation">
		<xsl:if test="parent::situation">
			<f:with-param name="parentSituation">
				<xsl:attribute name="value-var">
					<xsl:call-template name="getName">
						<xsl:with-param name="focus" select="parent::situation" />
					</xsl:call-template>
					<xsl:text>.o</xsl:text>
				</xsl:attribute>
			</f:with-param>
		</xsl:if>
	</xsl:template>
	
	<xsl:template name="getName">
		<xsl:param name="focus" select="." />
		<xsl:choose>
			<xsl:when test="$focus/@name">
				<xsl:value-of select="$focus/@name" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="generate-id($focus)" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
</xsl:stylesheet>