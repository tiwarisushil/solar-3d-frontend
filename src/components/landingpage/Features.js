'use client';

import Reveal from '../marketing/Reveal';
import { Container, Eyebrow, FeatureArt, Lede, SectionAnchor, Title } from './ui';

const FEATURES = [
  ['Win the customer', 'From the first enquiry to a priced offer.', [
    ['leads', 'Leads', 'Leads from Meta Lead Ads and Google Sheets arrive on their own; walk-ins go on your own form. Status, priority and who it is assigned to.'],
    ['lead-board', 'Lead board', 'Drag leads between stages on a board. Every status date, reschedule and reassignment is kept in the lead’s log.'],
    ['clients', 'Clients', 'Contact details, consumer number, sanctioned load and documents such as bills, ID proofs and roof photos in one record.'],
    ['quick', 'Quick proposals & estimation', 'A priced proposal from your packages and catalog in a minute, when a full 3D design is not needed.'],
    ['packages', 'Packages & catalog', 'Ready system packages and a product catalog with categories, so every quote uses your own items and prices.'],
  ]],
  ['Design the system', 'A 3D design anyone on your team can make.', [
    ['roof', 'Roof from the map', 'Mark the roof on the satellite map, then pick the house that looks like it: flat, one slope, two slopes, four slopes or Kerala style. Ground mounting too.'],
    ['panel-layout', 'Panel layout', 'Place mounting bases and plant panels on them, or fill the roof in one tap. Tanks, staircase rooms and trees are kept clear, with cleaning walkways.'],
    ['structure', 'Mounting structure', 'Pole heights, tilt and supports for each base. The frame is measured and priced by its total length.'],
    ['sun-shading', 'Sun & shading', 'Shadows from walls, obstacles and neighbouring rows are worked out hour by hour, with a shadow report and yearly energy.'],
    ['strings', 'Strings & single-line diagram', 'Strings are worked out for the inverter, or picked panel by panel. The single-line diagram is drawn and checked for you.'],
    ['buildings', 'Several buildings', 'A site with more than one building gets one design and one price, with a breakdown for each building.'],
  ]],
  ['Close the deal', 'Documents and money, in your brand.', [
    ['proposals', 'Branded proposals', 'A proposal PDF with the 3D model, bill of materials, drawings and savings outlook. Share by link, QR code or WhatsApp; clients accept online.'],
    ['loans', 'Loans', 'Set your own loan steps once. A proposal bought on a loan follows them, with remarks the client can read.'],
    ['subsidies', 'Subsidies', 'A subsidy file for each proposal with its own steps; the subsidy is shown under the price and on the PDF.'],
    ['bills', 'Bills', 'Bills for materials taken from stock and for services, with tax on each line and an optional discount.'],
    ['challans', 'Delivery challans', 'Ask for a delivery challan while making a bill: add the delivery details and it is printed with the bill, without prices.'],
    ['receipts', 'Receipts & dues', 'Record advances and part payments as receipts, and see at a glance which clients still owe money.'],
    ['currency-tax', 'Your currency & tax', 'Each company sets its own currency, tax name and usual rate; every screen and document follows it.'],
  ]],
  ['Deliver the project', 'Stock, site work and care after the sale.', [
    ['inventory', 'Inventory', 'Batches with base, wholesale and retail prices, serial numbers, warranties and suppliers. Stock is deducted when a bill is made.'],
    ['installations', 'Installations', 'Installation steps from your own template, assigned by job title and priority, with photos and notes from site.'],
    ['tasks', 'Task management', 'Give work to your staff and follow it until it is done.'],
    ['amc', 'AMC tracker', 'Free maintenance visits are scheduled from the installation date; paid visits are booked by the client and assigned to technicians.'],
    ['support', 'Client support', 'Clients raise requests with photos and PDFs; your team replies and tracks every thread.'],
    ['portal', 'Client portal', 'Clients sign in to read and answer proposals, follow their loan and subsidy, book visits and ask for help.'],
  ]],
  ['Run the company', 'Control for the owner, the right view for everyone else.', [
    ['dashboard', 'Dashboard', 'Charts of leads, proposals, sales and dues, so you see how the business is doing as soon as you sign in.'],
    ['expenses', 'Expenses', 'Record what the company spends, next to what it earns.'],
    ['team', 'Team & roles', 'Roles such as telecaller, accountant or supervisor, or your own. Staff see only what their role allows.'],
    ['branches', 'Branches', 'Work as one office or many. Products are shared across the company; stock, suppliers and packages belong to each branch.'],
    ['notifications', 'Notifications', 'Your team is told when something needs them: a new lead, an assigned step, a client request.'],
    ['private', 'Private by company', 'Every client, product, design and document belongs to one company and is only loaded for that company’s sign-in.'],
  ]],
];

export default function Features() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionAnchor id="features" />
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow>All features</Eyebrow>
            <Title className="mt-5 max-w-[22ch]">Everything a solar company does, already connected.</Title>
          </div>
          <Lede className="lg:col-span-5">No separate tools for leads, drawings, quotes and bills. What you enter once is used everywhere after it.</Lede>
        </Reveal>
        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
          {FEATURES.map(([group, sub, items], g) => (
            <div key={group} className="grid gap-8 lg:grid-cols-12">
              <Reveal className="lg:col-span-3">
                <div className="lg:sticky lg:top-28">
                  <div className="text-[13px] font-semibold tracking-wide text-brand uppercase">Step {g + 1}</div>
                  <h3 className="mt-2 text-[1.5rem] leading-tight font-semibold tracking-tight text-slate-950">{group}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{sub}</p>
                </div>
              </Reveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map(([art, name, text], i) => (
                  <Reveal key={name} delay={(i % 4) * 60}>
                    <article className="lp-card h-full rounded-2xl border border-slate-200 bg-white p-5">
                      <FeatureArt name={art} className="lp-art h-16 w-16" />
                      <h4 className="mt-4 text-[16px] font-semibold text-slate-950">{name}</h4>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-600">{text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
