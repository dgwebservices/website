/** Selected DG portal direction: Midnight dashboard, light and dark. */
export function renderMidnight(h) {
  const i = h.icon;
  const esc = h.escape || (value => String(value));
  const check = `<span class="md-online"><i></i>Actief</span>`;
  const website = ({index,domain,plan,used,limit,percent,price}) => `
    <article class="md-website">
      <div class="md-website-top">
        <span class="md-site-icon">${i('globe')}</span>
        <div class="md-website-name"><h3>${domain}</h3><span>${plan} <i>·</i> ${index === 1 ? 'WordPress' : 'Website'}</span></div>
        ${check}
        <button class="md-icon-button" data-action="hosting" data-id="${domain}" aria-label="Beheer ${domain}">${i('arrow')}</button>
      </div>
      <div class="md-website-bottom"><div class="md-usage"><div><span>Opslag</span><strong>${used} <small>/ ${limit} GB</small></strong></div><span class="md-track"><i style="width:${percent}%"></i></span></div><div class="md-hosting-price"><strong>€ ${price}</strong><span>/ maand excl. btw</span></div></div>
    </article>`;

  return `<div class="md-dashboard">
    <header class="md-heading"><div><span class="md-eyebrow">DUINDORP SV / JOUW DIGITALE OMGEVING</span><h1>Alles verbonden<span>.</span></h1></div><div class="md-heading-actions"><span class="md-today">Dinsdag 13 oktober <b>2026</b></span><button class="md-button md-button-outline" data-go="new">${i('plus')}<span>Nieuwe dienst</span></button></div></header>

    <section class="md-hero" aria-labelledby="md-hero-title">
      <div class="md-hero-copy"><span class="md-network-status"><i></i>Alle systemen operationeel</span><h2 id="md-hero-title">Jouw ambities.<br>Onze infrastructuur.</h2><p>Je digitale omgeving, helder geregeld.</p><button class="md-button md-button-primary" data-go="hosting">Beheer je omgeving ${i('arrow')}</button></div>
      <div class="md-network" aria-label="Je verbonden omgeving met 3 domeinen, 2 hostingpakketten en 8 mailboxen">
        <div class="md-network-ring md-ring-outer" aria-hidden="true"></div><div class="md-network-ring md-ring-middle" aria-hidden="true"></div><div class="md-network-ring md-ring-inner" aria-hidden="true"></div>
        <div class="md-network-core"><img src="${esc(h.logo(Boolean(h.dark),true))}" alt="DG Webservices"><i aria-hidden="true"></i></div>
        <button class="md-network-node md-node-domains" data-go="domains">${i('globe')}<span><strong>03</strong><small>Domeinen</small></span><i aria-hidden="true"></i></button>
        <button class="md-network-node md-node-hosting" data-go="hosting">${i('server')}<span><strong>02</strong><small>Hosting</small></span><i aria-hidden="true"></i></button>
        <button class="md-network-node md-node-mail" data-go="email">${i('mail')}<span><strong>08</strong><small>Mailboxen</small></span><i aria-hidden="true"></i></button>
        <span class="md-network-point md-point-one" aria-hidden="true"></span><span class="md-network-point md-point-two" aria-hidden="true"></span>
      </div>
    </section>

    <nav class="md-summary" aria-label="Diensten in het kort">
      <button data-go="domains"><span class="md-summary-label">${i('globe')}Domeinen</span><div><strong>3</strong><span>Allemaal actief</span>${i('arrow')}</div></button>
      <button data-go="hosting"><span class="md-summary-label">${i('server')}Hostingpakketten</span><div><strong>2</strong><span>Voor je websites</span>${i('arrow')}</div></button>
      <button data-go="email"><span class="md-summary-label">${i('mail')}Mailboxen</span><div><strong>8</strong><span>12,6 GB in gebruik</span>${i('arrow')}</div></button>
      <button data-action="invoice" data-id="DG-2026-0104"><span class="md-summary-label">${i('card')}Openstaand</span><div><strong class="md-summary-amount">€ 24,14</strong><span>incl. btw</span>${i('arrow')}</div></button>
    </nav>

    <div class="md-main-grid">
      <section class="md-panel md-websites"><div class="md-section-heading"><div><span class="md-eyebrow">JE ONLINE WERKPLEK</span><h2>Actieve websites <span>02</span></h2></div><button class="md-text-button" data-go="hosting">Alle hosting ${i('arrow')}</button></div>
        ${website({index:1,domain:'duindorpsv.nl',plan:'Hosting Plus',used:'8,4',limit:'50',percent:17,price:'19,95'})}
        ${website({index:2,domain:'clubhuis.online',plan:'Hosting Start',used:'1,2',limit:'10',percent:12,price:'4,95'})}
        <div class="md-websites-footer">${i('shield')}<span>Je websites zijn beveiligd. Back-up van vandaag om 03:00 beschikbaar.</span><button data-action="backup">Bekijken ${i('arrow')}</button></div>
      </section>

      <aside class="md-panel md-upcoming" aria-labelledby="md-upcoming-title"><div class="md-section-heading"><div><span class="md-eyebrow">VOORUITKIJKEN</span><h2 id="md-upcoming-title">Komt eraan</h2></div><button class="md-calendar-button" data-action="calendar" aria-label="Bekijk je volledige agenda">${i('clock')}</button></div>
        <button class="md-renewal" data-action="domain" data-id="duindorpsv.nl"><span class="md-renewal-date"><strong>18</strong><span>NOVEMBER</span></span><span class="md-renewal-info"><span class="md-auto-renew">${i('check')}Automatisch · aan</span><strong>duindorpsv.nl</strong><span>€ 12,95 / jaar excl. btw</span></span>${i('arrow')}</button>
        <p class="md-renewal-note">Je domeinnaam blijft van jou. Wij regelen de verlenging.</p>
        <div class="md-agenda-list"><button class="md-agenda-row" data-action="invoice" data-id="DG-2026-0104"><span class="md-agenda-date"><b>20</b>OKT</span><span><strong>Factuur vervalt</strong><small>Hosting Plus · € 24,14 incl. btw</small></span><i class="md-agenda-dot"></i>${i('arrow')}</button><button class="md-agenda-row" data-go="subscriptions"><span class="md-agenda-date"><b>01</b>NOV</span><span><strong>Nieuwe maandtermijn</strong><small>Hosting Plus · € 19,95 excl. btw</small></span>${i('arrow')}</button></div>
        <button class="md-agenda-all" data-action="calendar">Bekijk alle aankomende momenten ${i('arrow')}</button>
      </aside>
    </div>

    <div class="md-bottom-grid"><section class="md-panel md-activity"><div class="md-section-heading"><h2>Recent geregeld</h2><span class="md-quiet">Alles loopt door.</span></div><div class="md-activity-items"><button data-action="backup"><span class="md-activity-icon">${i('shield')}</span><div><strong>Back-up gemaakt</strong><span>Vandaag · 03:00</span></div><i></i></button><button data-go="email"><span class="md-activity-icon">${i('mail')}</span><div><strong>Mailbox toegevoegd</strong><span>kantine@duindorpsv.nl</span></div><i></i></button><button data-action="invoice" data-id="DG-2026-0104"><span class="md-activity-icon">${i('card')}</span><div><strong>Factuur staat klaar</strong><span>6 oktober · Hosting Plus</span></div>${i('arrow')}</button></div></section><section class="md-panel md-support"><div class="md-support-top"><span class="md-support-icon">${i('support')}</span><span class="md-eyebrow">PERSOONLIJK DICHTBIJ</span></div><h2>Duindorp SV, we denken mee.</h2><p>Van een korte vraag tot je volgende stap online.</p><button class="md-text-button" data-action="ticket">Stel je vraag ${i('arrow')}</button></section></div>
  </div>`;
}
