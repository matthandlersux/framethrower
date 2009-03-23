<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:svg="http://www.w3.org/2000/svg"
	version="1.0">
	
	<xsl:include href="../../util.xsl" />
	
	<xsl:param name="dimensions" />

	<xsl:variable name="uins">http://www.filmsfolded.com/xsl/ui</xsl:variable>

	<xsl:template match="*">
		<svg:svg version="1.1" width="{$dimensions/@width}" height="{$dimensions/@height}">
			<xsl:variable name="fromanchors" select="*[*[@type='linkend'][@end='from']]" />
			<xsl:variable name="toanchors" select="*[*[@type='linkend'][@end='to']]" />

			<xsl:for-each select="$fromanchors">
				<xsl:variable name="startx" select="@x + @width * */@attachx" />
				<xsl:variable name="starty" select="@y + @height * */@attachy" />
				<xsl:variable name="startvelx" select="*/@velx" />
				<xsl:variable name="startvely" select="*/@vely" />
				<xsl:variable name="lp" select="*/@linkpath" />
				<xsl:variable name="style" select="*/style" />

				<xsl:for-each select="$toanchors">
					<xsl:if test="*/@linkpath = $lp">

						<xsl:call-template name="dp">
							<xsl:with-param name="startx" select="$startx" />
							<xsl:with-param name="starty" select="$starty" />
							<xsl:with-param name="startvelx" select="$startvelx" />
							<xsl:with-param name="startvely" select="$startvely" />
							<xsl:with-param name="endx" select="@x + @width * */@attachx" />
							<xsl:with-param name="endy" select="@y + @height * */@attachy" />
							<xsl:with-param name="endvelx" select="*/@velx" />
							<xsl:with-param name="endvely" select="*/@vely" />
							<xsl:with-param name="style" select="$style" />

						</xsl:call-template>

					</xsl:if>
				</xsl:for-each>
			</xsl:for-each>

			<xsl:variable name="uniqueidanchors" select="*[*[@type='uniqueid']]" />
			<xsl:for-each select="$uniqueidanchors">
				<xsl:variable name="startx" select="@x" />
				<xsl:variable name="starty" select="@y" />
				<xsl:variable name="startwidth" select="@width" />
				<xsl:variable name="startheight" select="@height" />
				<xsl:variable name="uniqueid" select="*" />
				<xsl:variable name="pos" select="position()" />
				
				<xsl:for-each select="$uniqueidanchors[position() &gt; $pos]">
					<xsl:if test="*/@path = $uniqueid/@path">
						<xsl:variable name="deepequal">
							<xsl:call-template name="deepequals">
								<xsl:with-param name="a" select="*/*" />
								<xsl:with-param name="b" select="$uniqueid/*" />
							</xsl:call-template>
						</xsl:variable>
						<xsl:if test="$deepequal=1">
							<!--><svg:line x1="{$startx}" y1="{$starty}" x2="{@x + @width div 2}" y2="{@y + @height div 2}"
								stroke="#999" stroke-width="2" stroke-dasharray="4,2" />-->
							<xsl:call-template name="drawprojection">
								<xsl:with-param name="ax" select="$startx" />
								<xsl:with-param name="ay" select="$starty" />
								<xsl:with-param name="awidth" select="$startwidth" />
								<xsl:with-param name="aheight" select="$startheight" />
								<xsl:with-param name="bx" select="@x" />
								<xsl:with-param name="by" select="@y" />
								<xsl:with-param name="bwidth" select="@width" />
								<xsl:with-param name="bheight" select="@height" />
							</xsl:call-template>
						</xsl:if>
					</xsl:if>
				</xsl:for-each>
			</xsl:for-each>
		</svg:svg>
	</xsl:template>

	<xsl:template name="dp">
		<xsl:param name="startx" />
		<xsl:param name="starty" />
		<xsl:param name="startvelx" select="0" />
		<xsl:param name="startvely" select="0" />
		<xsl:param name="endx" />
		<xsl:param name="endy" />
		<xsl:param name="endvelx" select="0" />
		<xsl:param name="endvely" select="0" />
		<xsl:param name="style" />
		
		<xsl:variable name="curvature" select="100" />

		<svg:path fill="none" stroke-width="2">
			<xsl:copy-of select="$style/@*" />
			<xsl:attribute name="d">
				<xsl:value-of select="concat(
					'M ',$startx,' ',$starty,' ',
					'C ',
						$startx+$curvature*$startvelx,' ',
						$starty+$curvature*$startvely,' ',
						$endx+$curvature*$endvelx,' ',
						$endy+$curvature*$endvely,' ',
						$endx,' ',
						$endy,' ',
					'')" />
			</xsl:attribute>
		</svg:path>
	</xsl:template>

	<xsl:template name="drawprojection">
		<xsl:param name="ax" />
		<xsl:param name="ay" />
		<xsl:param name="awidth" />
		<xsl:param name="aheight" />
		<xsl:param name="bx" />
		<xsl:param name="by" />
		<xsl:param name="bwidth" />
		<xsl:param name="bheight" />
		
		<svg:polygon fill="#999" opacity="0.2">
			<xsl:attribute name="points">
				<xsl:choose>
					<xsl:when test="$ax &lt; $bx">
						<xsl:value-of select="concat($ax,',',$ay,' ',$ax,',',$ay+$aheight,' ')" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="concat($bx,',',$by,' ',$bx,',',$by+$bheight,' ')" />
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="$ay+$aheight &gt; $by+$bheight">
						<xsl:value-of select="concat($ax,',',$ay+$aheight,' ',$ax+$awidth,',',$ay+$aheight,' ')" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="concat($bx,',',$by+$bheight,' ',$bx+$bwidth,',',$by+$bheight,' ')" />
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="$ax+$awidth &gt; $bx+$bwidth">
						<xsl:value-of select="concat($ax+$awidth,',',$ay+$aheight,' ',$ax+$awidth,',',$ay,' ')" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="concat($bx+$bwidth,',',$by+$bheight,' ',$bx+$bwidth,',',$by,' ')" />
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="$ay &lt; $by">
						<xsl:value-of select="concat($ax+$awidth,',',$ay,' ',$ax,',',$ay,'')" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="concat($bx+$bwidth,',',$by,' ',$bx,',',$by,'')" />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
		</svg:polygon>
	</xsl:template>

</xsl:stylesheet><!-- Stylus Studio meta-information - (c) 2004-2006. Progress Software Corporation. All rights reserved.
<metaInformation>
<scenarios/><MapperMetaTag><MapperInfo srcSchemaPathIsRelative="yes" srcSchemaInterpretAsXML="no" destSchemaPath="" destSchemaRoot="" destSchemaPathIsRelative="yes" destSchemaInterpretAsXML="no"/><MapperBlockPosition></MapperBlockPosition><TemplateContext></TemplateContext><MapperFilter side="source"></MapperFilter></MapperMetaTag>
</metaInformation>
-->