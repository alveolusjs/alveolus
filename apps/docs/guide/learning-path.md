---
description: "New to Domain-Driven Design? A reading order through the Alveolus docs, from bounded contexts to aggregates, handlers and architecture checks, in TypeScript."
---

# Learning path

New to Domain-Driven Design? Read the pages in this order: each step builds on the one before, and
each page explains one idea with the same `Order` example.

::: info An introduction, not a course
These pages explain each idea as far as you need it to use Alveolus. They are not a complete course
on Domain-Driven Design. For the whole picture, read the books:

- *Domain-Driven Design: Tackling Complexity in the Heart of Software*, Eric Evans, 2003
- *Implementing Domain-Driven Design*, Vaughn Vernon, 2013
- *Domain-Driven Design Distilled*, Vaughn Vernon, 2016
- *Learning Domain-Driven Design*, Vlad Khononov, 2021
:::

<dl class="al-glance">
	<dt>For</dt><dd>Developers who know TypeScript and have never used Domain-Driven Design</dd>
	<dt>You need</dt><dd>TypeScript and classes, nothing about DDD</dd>
	<dt>Order</dt><dd>The one of <em>Domain-Driven Design Distilled</em> (Vaughn Vernon, 2016): split the system first, then model each part</dd>
</dl>

::: tip Already know DDD?
Go straight to [Getting started](./getting-started.md) and come back to a page when you need it.
:::

## Why DDD

Software gets hard to change when its code no longer says what the business means. DDD puts the
business at the center of the code, in its own words.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="../core/">Building blocks</a></span>What Alveolus gives you: the patterns of DDD as classes your code extends.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="../core/domain/">The domain</a></span>Why the model of the business lives apart from frameworks and databases.</div>
</div>

## Split the system

Before writing a class, decide where its words apply. A "product" in the catalog and a "product" in
ordering are not the same thing: each part of the system gets its own model.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="../core/strategic/">Strategic design</a></span>What a bounded context is, and why contexts never share their models.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="./project-layout">Project layout</a></span>Where every class goes: one folder per context, with its domain, application and adapters inside, and who may import what.</div>
</div>

## Model the rules

Inside a context, the domain holds the business rules. Start from the smallest pieces and build up
to the aggregate, the object that keeps the rules of an order.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="../core/domain/value-objects">Value objects</a></span>Values such as an amount or an <code>OrderId</code>, checked once and never changed.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="../core/domain/entities">Entities</a></span>Objects that keep their identity while they change, such as an order line.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="../core/domain/aggregates">Aggregates</a></span>The <code>Order</code> and its lines, changed as one unit through the root that keeps the rules.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">8</span><a href="../core/domain/domain-errors">Domain errors</a></span>Expected failures, such as an empty order, named in the business's words.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">9</span><a href="../core/utilities/result">Result</a></span>How a method returns a domain error instead of throwing it.</div>
</div>

## Record what happened

When the rules accept a change, the aggregate records it as a fact other code can react to.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">10</span><a href="../core/domain/domain-events">Domain events</a></span>Facts named in the past tense, such as <code>OrderPlaced</code>.</div>
</div>

## Reach the outside world

The domain still needs things it does not own: a rule spread over several objects, a price from
elsewhere, a place to store orders. It asks for them in its own words.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">11</span><a href="../core/domain/domain-services">Domain services</a></span>Rules that no single object owns.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">12</span><a href="../core/domain/ports">Ports</a></span>What the domain needs from outside, as abstract classes.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">13</span><a href="../core/domain/repositories">Repositories</a></span>The ports that load and save aggregates and views.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">14</span><a href="../core/domain/views">Views</a></span>The read-only shape a query returns.</div>
</div>

## Run a use case

The application layer turns a request, such as "place this order", into a call to the domain, and
saves the result.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">15</span><a href="../core/application/">The application</a></span>How a request flows from the outside to the domain and back.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">16</span><a href="../core/application/command-handlers">Command handlers</a></span>Load an aggregate, call one method, save it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">17</span><a href="../core/application/query-handlers">Query handlers</a></span>Read a view, without loading an aggregate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">18</span><a href="../core/application/unit-of-work">Unit of Work</a></span>All the writes of a use case kept together, or none.</div>
</div>

## Talk to other contexts

Contexts never import each other. They tell each other what happened in plain JSON, and each one
translates what it reads into its own model.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">19</span><a href="../core/application/event-translators">Event translators</a></span>Turn domain events into messages for other contexts.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">20</span><a href="../core/application/integration-events">Integration events</a></span>Versioned JSON messages other contexts receive.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">21</span><a href="../core/application/event-publishers">Event publishers</a></span>The port that sends them to a broker.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">22</span><a href="../core/application/outbox">Outbox</a></span>How no message is lost when the change is saved.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">23</span><a href="../core/strategic/published-language">Published Language</a></span>The JSON contract between contexts.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">24</span><a href="../core/strategic/open-host-services">Open host services</a></span>The one entry point other contexts may call.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">25</span><a href="../core/strategic/anti-corruption-layers">Anti-corruption layers</a></span>Translate another context into your own words.</div>
</div>

## Keep it on track

Each idea above becomes a rule the checks verify, so the code keeps it whoever writes it.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">26</span><a href="../rules/">Rules</a></span>What <code>alveolus arch check</code> reports, and why.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">27</span><a href="./getting-started">Getting started</a></span>Install Alveolus and run the checks on your project.</div>
</div>

## See also

- [Getting started](./getting-started.md), to install Alveolus and run the checks
- [Project layout](./project-layout.md), the folders and layers of a project
- [Building blocks](../core/index.md), every class `@alveolus/core` gives
