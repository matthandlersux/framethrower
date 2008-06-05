<xsl:stylesheet
    xmlns:f="http://www.filmsfolded.com/xsl/ui"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:svg="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	version="1.0">

<xsl:param name="fromx" />
<xsl:param name="fromy" />
<xsl:param name="midx1" />
<xsl:param name="midy1" />
<xsl:param name="midx2" />
<xsl:param name="midy2" />
<xsl:param name="tox" />
<xsl:param name="toy" />

	
	<xsl:template match="object">
	    <svg:circle r="20" fill="url(#gradient)">
	    	<xsl:attribute name="cx">
				<xsl:value-of select="$fromx" />
			</xsl:attribute>
	    	<xsl:attribute name="cy">
				<xsl:value-of select="$fromy" />
			</xsl:attribute>
	    </svg:circle>
	</xsl:template>


	<xsl:template match="link">
		<svg:g>
			<svg:path id="{@from}{@type}{@to}" d="M{$fromx},{$fromy} Q{$midx1},{$midy1} {$midx2},{$midy2} T{$tox},{$toy}"
			fill="none" stroke="red" stroke-width="5"  />
			<svg:text>
				<svg:textPath xlink:href="#{@from}{@type}{@to}" startOffset="30%">
					<svg:tspan dy="-5">
						<xsl:value-of select="@type" />
					</svg:tspan>
				</svg:textPath>
			</svg:text>
		</svg:g>
	</xsl:template>
	
</xsl:stylesheet>