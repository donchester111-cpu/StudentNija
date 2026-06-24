<?xml version="1.0" encoding="UTF-8"?><xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

<xsl:template match="/">

<html>
<head>
<title>StudentNija Sitemap</title><style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Inter,Arial,sans-serif;
}

body{
    background:linear-gradient(135deg,#0f172a,#111827);
    color:#fff;
    min-height:100vh;
    padding:30px;
}

.container{
    max-width:1100px;
    margin:auto;
}

.header{
    background:linear-gradient(135deg,#008751,#00c878);
    padding:30px;
    border-radius:25px;
    margin-bottom:25px;
    box-shadow:0 15px 40px rgba(0,135,81,.35);
}

.header h1{
    font-size:38px;
    margin-bottom:10px;
}

.header p{
    opacity:.9;
}

.card{
    background:rgba(255,255,255,.05);
    backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.08);
    border-radius:25px;
    overflow:hidden;
}

table{
    width:100%;
    border-collapse:collapse;
}

th{
    background:#008751;
    color:white;
    text-align:left;
    padding:18px;
    font-size:15px;
}

td{
    padding:18px;
    border-bottom:1px solid rgba(255,255,255,.08);
}

tr:hover{
    background:rgba(255,255,255,.05);
}

a{
    color:#00e38a;
    text-decoration:none;
    font-weight:600;
}

a:hover{
    text-decoration:underline;
}

.footer{
    margin-top:25px;
    text-align:center;
    opacity:.7;
}

.badge{
    display:inline-block;
    background:#008751;
    padding:8px 14px;
    border-radius:999px;
    margin-top:10px;
    font-size:13px;
}
</style></head><body><div class="container"><div class="header">
<h1>🎓 StudentNija Sitemap</h1>
<p>Official Search Engine Sitemap</p>
<div class="badge">
Total URLs:
<xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
</div>
</div><div class="card"><table><tr>
<th>Page URL</th>
<th>Last Modified</th>
</tr><xsl:for-each select="sitemap:urlset/sitemap:url">

<tr><td>
<a href="{sitemap:loc}">
<xsl:value-of select="sitemap:loc"/>
</a>
</td><td>
<xsl:value-of select="sitemap:lastmod"/>
</td></tr></xsl:for-each>

</table></div><div class="footer">
StudentNija • Learn Smarter. Score Higher.
</div></div></body>
</html></xsl:template>

</xsl:stylesheet>
