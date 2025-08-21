<#--
  Minimal template wrapper for the login theme.
  We keep parent=keycloak, so parent pages (login.ftl, etc.) will use this layout.
-->
<#import "login.ftl" as ignored> <#-- ensure path resolution in some versions -->

<#macro layout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${locale.currentLanguageTag}">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css"/>
    <link rel="stylesheet" href="${url.resourcesPath}/../styles.css"/> <#-- our custom -->
  </head>
  <body class="kc-body ${bodyClass}">
    <header class="kc-header">
      <a href="${properties.kcHeaderUrl!'#'}" class="kc-brand" aria-label="Home">
        <picture>
          <source srcset="${url.resourcesPath}/img/sarkis-logo.svg" type="image/svg+xml">
          <img src="${url.resourcesPath}/img/sarkis-logo.png" alt="Sarkis" class="kc-logo"/>
        </picture>
      </a>
      <h1 class="kc-title">${realm.displayName!realm.name}</h1>
    </header>

    <main id="kc-main" class="kc-main">
      <#-- Keycloak will inject the page content here -->
      <#nested "content">
    </main>

    <footer class="kc-footer">
      <span>© ${.now?string["yyyy"]} Sarkis.dev</span>
    </footer>
  </body>
</html>
</#macro>
