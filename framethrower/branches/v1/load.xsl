<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:f="http://www.filmsfolded.com/xsl/ui"
	version="1.0">

	<xsl:param name="prefix" />
	<xsl:param name="id" />

	<xsl:variable name="fns">http://www.filmsfolded.com/xsl/ui</xsl:variable>

	<xsl:template match="*">
		<xsl:call-template name="print" />
	</xsl:template>

	<xsl:template name="print">
		<xsl:param name="prefix" select="$prefix" />
		<xsl:param name="id" select="$id" />
		
		<xsl:variable name="path">
			<xsl:choose>
				<xsl:when test="$prefix = ''">
					<xsl:value-of select="$id" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="concat($prefix, '/', $id)" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		
		<xsl:copy>
			<xsl:copy-of select="@*[not(self::f:id or self::f:path)]" />
			<xsl:attribute name="f:id">
				<xsl:value-of select="$id" />
			</xsl:attribute>
			<xsl:attribute name="f:path">
				<xsl:value-of select="$path" />
			</xsl:attribute>
			<xsl:for-each select="*">
				<xsl:call-template name="print">
					<xsl:with-param name="prefix" select="$path" />
					<xsl:with-param name="id">
						<xsl:call-template name="getid" />
					</xsl:with-param>
				</xsl:call-template>
			</xsl:for-each>
		</xsl:copy>
	</xsl:template>

	<xsl:template name="getid">
		<xsl:choose>
			<xsl:when test="@f:id">
				<xsl:call-template name="makeunique">
					<xsl:with-param name="s" select="@f:id" />
					<xsl:with-param name="already" select="1" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="name" select="name()" />
				<xsl:variable name="num" select="count(preceding-sibling::*[name()=$name])+1" />
				<xsl:call-template name="makeunique">
					<xsl:with-param name="s" select="concat($name,'[',$num,']')" />
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<!-- this still doesn't quite work... -->
	<xsl:template name="makeunique">
		<xsl:param name="s" />
		<xsl:param name="already" select="0" />
		<xsl:choose>
			<xsl:when test="count(../*[@f:id=$s]) &gt; $already">
				<xsl:call-template name="makeunique">
					<xsl:with-param name="s" select="concat($s,generate-id(.))" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$s" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>