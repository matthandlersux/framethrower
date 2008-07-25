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
	<xsl:param name="r" />
	<xsl:param name="objid" />

	<xsl:template match="situation">
		<svg:g>
			<svg:circle stroke-width="3px" stroke="#A9E951" fill="white" opacity=".45">
				<xsl:call-template name="circleatts" />				
			</svg:circle>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>

	<xsl:template match="object|individual">
		<svg:g>
			<svg:circle stroke-width="3px" stroke="#10ADED" fill="#ABCDEF">
				<xsl:call-template name="circleatts" />				
			</svg:circle>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>

	<xsl:template match="ghost">
		<svg:g>
			<svg:circle stroke-width="3px" stroke="#10ADED" opacity=".3" fill="#ABCDEF">
				<xsl:call-template name="circleatts" />				
			</svg:circle>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>

	<xsl:template match="relation|role|infon">
		<svg:g>
			<svg:circle stroke-width="3px" stroke="black" fill="purple">
				<xsl:call-template name="circleatts" />				
			</svg:circle>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>
	
	<xsl:template match="q">
		<svg:g>
			<svg:rect stroke-width="3px" stroke="#B00B1E" fill="#F00D1E">
				<xsl:call-template name="rectatts" />				
			</svg:rect>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>


	<xsl:template name="circleatts">
		<xsl:attribute name="r">
			<xsl:value-of select="$r" />
		</xsl:attribute>
		<xsl:attribute name="cx">
			<xsl:value-of select="$fromx" />
		</xsl:attribute>
		<xsl:attribute name="cy">
			<xsl:value-of select="$fromy" />
		</xsl:attribute>
		<xsl:attribute name="id">
			<xsl:value-of select="$objid" />
		</xsl:attribute>
	</xsl:template>


	<xsl:template name="rectatts">
		<xsl:attribute name="width">
			<xsl:value-of select="$r" />
		</xsl:attribute>
		<xsl:attribute name="height">
			<xsl:value-of select="$r" />
		</xsl:attribute>
		<xsl:attribute name="x">
			<xsl:value-of select="$fromx" />
		</xsl:attribute>
		<xsl:attribute name="y">
			<xsl:value-of select="$fromy" />
		</xsl:attribute>
		<xsl:attribute name="id">
			<xsl:value-of select="$objid" />
		</xsl:attribute>
	</xsl:template>


	<xsl:template name="text">
		<svg:text>
			<xsl:attribute name="x">
				<xsl:value-of select="$fromx" />
			</xsl:attribute>
			<xsl:attribute name="y">
				<xsl:value-of select="$fromy" />
			</xsl:attribute>
			<xsl:value-of select="id"/>
		</svg:text>
	</xsl:template>


	<xsl:template match="link">
		<svg:g>
			<svg:path id="{@from}{@type}{@to}" d="M{$fromx},{$fromy} Q{$midx1},{$midy1} {$midx2},{$midy2} T{$tox},{$toy}"
				fill="none" stroke="#FFC426" stroke-width="5"  />
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