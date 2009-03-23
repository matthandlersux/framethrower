<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:svg="http://www.w3.org/2000/svg"
	xmlns:html="http://www.w3.org/1999/xhtml"
	version="1.0">
	
	<xsl:include href="../../util.xsl" />
	
	<xsl:param name="layer1" />
	<xsl:param name="drawshadow" select="0" />
	<xsl:param name="curvature" />
	<xsl:param name="dimensions" />

	<xsl:variable name="uins">http://www.filmsfolded.com/xsl/ui</xsl:variable>

	<xsl:template name="drawlinks">
		<xsl:param name="set1" />
		<xsl:param name="set2" />
		<xsl:param name="shadow" />
		
		<xsl:for-each select="$set1">
			<xsl:variable name="s1" select="." />
			<xsl:variable name="startx" select="@x + @width * */@attachx" />
			<xsl:variable name="starty" select="@y + @height * */@attachy" />
			<xsl:variable name="startvelx" select="*/@velx" />
			<xsl:variable name="startvely" select="*/@vely" />
			<xsl:variable name="lp" select="*/@linkpath" />
			<xsl:variable name="style" select="*/style" />



			<xsl:for-each select="$set2">
				<xsl:variable name="s2" select="." />
				<xsl:if test="*/@linkpath = $lp">
					
					<xsl:choose>
						<xsl:when test="$startx &lt; 2 and $starty &lt; 2 and $startvelx=0 and $startvely=0">
							<xsl:call-template name="dp">
								<xsl:with-param name="startx" select="@x + @width * */@attachx" />
								<xsl:with-param name="starty" select="@y + @height * */@attachy" />
								<xsl:with-param name="startvelx" select="$startvelx" />
								<xsl:with-param name="startvely" select="$startvely" />
								<xsl:with-param name="endx" select="@x + @width * */@attachx" />
								<xsl:with-param name="endy" select="@y + @height * */@attachy" />
								<xsl:with-param name="endvelx" select="*/@velx" />
								<xsl:with-param name="endvely" select="*/@vely" />
								<xsl:with-param name="style" select="$style" />
								

							</xsl:call-template>
						</xsl:when>
						<xsl:otherwise>
							<xsl:call-template name="dp">
								<xsl:with-param name="startx" select="$startx" />
								<xsl:with-param name="starty" select="$starty" />
								<xsl:with-param name="startvelx" select="$startvelx" />
								<xsl:with-param name="startvely" select="$startvely" />
								<xsl:with-param name="startshadow" select="$s1/*/@drawshadow" />
								<xsl:with-param name="endx" select="@x + @width * */@attachx" />
								<xsl:with-param name="endy" select="@y + @height * */@attachy" />
								<xsl:with-param name="endvelx" select="*/@velx" />
								<xsl:with-param name="endvely" select="*/@vely" />
								<xsl:with-param name="endshadow" select="$s2/*/@drawshadow" />
								<xsl:with-param name="style" select="$style" />
								<!--><xsl:if test="$s1/*/@drawshadow=1 or $s2/*/@drawshadow=1 or 1=1">
									<xsl:with-param name="shadow" select="$shadow" />
								</xsl:if>-->
								<xsl:with-param name="shadow" select="$shadow" />

							</xsl:call-template>
						</xsl:otherwise>
					</xsl:choose>



				</xsl:if>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="*">
		<xsl:variable name="fromanchors" select="*[*[@type='linkend'][@end='from']]" />
		<xsl:variable name="toanchors" select="*[*[@type='linkend'][@end='to']]" />

		<xsl:variable name="uniqueidanchors" select="*[*[@type='uniqueid']]" />		
		
		<xsl:choose>
			<xsl:when test="$fromanchors | $toanchors | $uniqueidanchors">
				<xsl:variable name="layer1fromanchors" select="$layer1/*[*[@type='linkend'][@end='from']]" />
				<xsl:variable name="layer1toanchors" select="$layer1/*[*[@type='linkend'][@end='to']]" />
				<xsl:variable name="layer1uniqueidanchors" select="$layer1/*[*[@type='uniqueid']]" />
				
				<svg:svg version="1.1" width="{$dimensions/@width}" height="{$dimensions/@height}">
	
					<xsl:for-each select="$uniqueidanchors">
						<!--><xsl:variable name="startx" select="@x + @width div 2" />
						<xsl:variable name="starty" select="@y + @height div 2" />-->
						<xsl:variable name="startx" select="@x" />
						<xsl:variable name="starty" select="@y" />
						<xsl:variable name="startwidth" select="@width" />
						<xsl:variable name="startheight" select="@height" />
						<xsl:variable name="uniqueid" select="*" />
						<xsl:variable name="pos" select="position()" />
						
						<xsl:if test="$drawshadow=1 and */@drawshadow=1">
							<svg:rect x="{@x - 1}" y="{@y - 1}" width="{@width + 2}" height="{@height + 2}" fill="#000" />
						</xsl:if>

						<xsl:for-each select="$uniqueidanchors[position() &gt; $pos] | $layer1uniqueidanchors">
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
					
					<xsl:if test="$drawshadow=1">
						<svg:defs>
							<svg:linearGradient id="h_trans_black" x1="0%" y1="0%" x2="100%" y2="0%">
								<svg:stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0"/>
								<svg:stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1"/>
							</svg:linearGradient>
							<svg:linearGradient id="h_black_trans" x1="100%" y1="0%" x2="0%" y2="0%">
								<svg:stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0"/>
								<svg:stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1"/>
							</svg:linearGradient>
							<svg:linearGradient id="v_trans_black" x1="0%" y1="0%" x2="0%" y2="100%">
								<svg:stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0"/>
								<svg:stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1"/>
							</svg:linearGradient>
							<svg:linearGradient id="v_black_trans" x1="0%" y1="100%" x2="0%" y2="0%">
								<svg:stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0"/>
								<svg:stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1"/>
							</svg:linearGradient>
						</svg:defs>
					</xsl:if>
					
					<xsl:call-template name="drawlinks">
						<xsl:with-param name="set1" select="$fromanchors" />
						<xsl:with-param name="set2" select="$toanchors" />
						<xsl:with-param name="shadow" select="'both'" />
					</xsl:call-template>
					
					<xsl:call-template name="drawlinks">
						<xsl:with-param name="set1" select="$fromanchors" />
						<xsl:with-param name="set2" select="$layer1toanchors" />
						<xsl:with-param name="shadow" select="'start'" />
					</xsl:call-template>

					<xsl:call-template name="drawlinks">
						<xsl:with-param name="set1" select="$toanchors" />
						<xsl:with-param name="set2" select="$layer1fromanchors" />
						<xsl:with-param name="shadow" select="'end'" />
					</xsl:call-template>


				</svg:svg>
			</xsl:when>
			<xsl:otherwise>
				<html:div />
			</xsl:otherwise>
		</xsl:choose>
		

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

	<xsl:template name="dp">
		<xsl:param name="startx" />
		<xsl:param name="starty" />
		<xsl:param name="startvelx" select="0" />
		<xsl:param name="startvely" select="0" />
		<xsl:param name="startshadow" select="0" />
		<xsl:param name="endx" />
		<xsl:param name="endy" />
		<xsl:param name="endvelx" select="0" />
		<xsl:param name="endvely" select="0" />
		<xsl:param name="endshadow" select="0" />
		<xsl:param name="style" />
		<xsl:param name="shadow" />
		
		<xsl:if test="$drawshadow=1 and ($startshadow=1 or $endshadow=1)">
			<xsl:variable name="shadowstroke">
				<xsl:choose>
					<xsl:when test="$shadow='both'">#000</xsl:when>
					<xsl:when test="$shadow='start' and $startvelx=0">url(#v_black_trans)</xsl:when>
					<xsl:when test="$shadow='start' and $startvely=0">url(#h_black_trans)</xsl:when>
					<xsl:when test="$shadow='end' and $endvelx=0">url(#v_trans_black)</xsl:when>
					<xsl:when test="$shadow='end' and $endvely=0">url(#h_trans_black)</xsl:when>
				</xsl:choose>
			</xsl:variable>

			<svg:path fill="none" stroke-width="4" stroke="{$shadowstroke}">
				<xsl:copy-of select="$style/@*[local-name() != 'stroke']" />
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
		</xsl:if>

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


</xsl:stylesheet>