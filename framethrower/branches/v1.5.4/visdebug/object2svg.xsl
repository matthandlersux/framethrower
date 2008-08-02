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
	<xsl:param name="shape" />
	<xsl:param name="cssclass" />

	<xsl:template match="object">
		<xsl:choose>
			<xsl:when test="$shape = 'circle'">
				<xsl:call-template name="circle" />
			</xsl:when>
			<xsl:when test="$shape = 'rectangle'">
				<xsl:call-template name="rectangle" />
			</xsl:when>
			<xsl:when test="$shape = 'uptriangle'">
				<xsl:call-template name="uptriangle" />
			</xsl:when>
			<xsl:when test="$shape = 'downtriangle'">
				<xsl:call-template name="downtriangle" />
			</xsl:when>
		</xsl:choose>
		

	</xsl:template>

	<xsl:template name="circle">
		<svg:g>
			<svg:circle>
				<xsl:attribute name="class">
					<xsl:value-of select="$cssclass" />
				</xsl:attribute>
				<xsl:call-template name="circleatts" />				
			</svg:circle>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>


	<xsl:template name="rectangle">
		<svg:g>
			<svg:rect>
				<xsl:attribute name="class">
					<xsl:value-of select="$cssclass" />
				</xsl:attribute>
				<xsl:call-template name="rectatts" />				
			</svg:rect>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>

	<xsl:template name="uptriangle">
		<svg:g>
			<svg:polygon>
				<xsl:attribute name="class">
					<xsl:value-of select="$cssclass" />
				</xsl:attribute>
				<xsl:call-template name="uptriatts" />
			</svg:polygon>
			<xsl:call-template name="text" />
		</svg:g>
	</xsl:template>

	<xsl:template name="downtriangle">
		<svg:g>
			<svg:polygon>
				<xsl:attribute name="class">
					<xsl:value-of select="$cssclass" />
				</xsl:attribute>
				<xsl:call-template name="downtriatts" />
			</svg:polygon>
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
			<xsl:value-of select="2*$r" />
		</xsl:attribute>
		<xsl:attribute name="height">
			<xsl:value-of select="2*$r" />
		</xsl:attribute>
		<xsl:attribute name="x">
			<xsl:value-of select="$fromx - $r" />
		</xsl:attribute>
		<xsl:attribute name="y">
			<xsl:value-of select="$fromy - $r" />
		</xsl:attribute>
		<xsl:attribute name="id">
			<xsl:value-of select="$objid" />
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="uptriatts">
		<xsl:attribute name="points">
			<xsl:value-of select="$fromx - $r*2.155" />,
			<xsl:value-of select="$fromy + $r" />,
			<xsl:value-of select="$fromx" />,
			<xsl:value-of select="$fromy - $r*2.732" />,
			<xsl:value-of select="$fromx + $r*2.155" />,
			<xsl:value-of select="$fromy + $r" />
		</xsl:attribute>
		<xsl:attribute name="id">
			<xsl:value-of select="$objid" />
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="downtriatts">
		<xsl:attribute name="points">
			<xsl:value-of select="$fromx - $r*2.155" />,
			<xsl:value-of select="$fromy - $r" />,
			<xsl:value-of select="$fromx" />,
			<xsl:value-of select="$fromy + $r*2.732" />,
			<xsl:value-of select="$fromx + $r*2.155" />,
			<xsl:value-of select="$fromy - $r" />
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
			<xsl:value-of select="@type"/>
		</svg:text>
	</xsl:template>


	<xsl:template match="link">
		<svg:g>
			<svg:path id="{@from}{@type}{@to}" d="M{$fromx},{$fromy} Q{$midx1},{$midy1} {$midx2},{$midy2} T{$tox},{$toy}" class="link"/>
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