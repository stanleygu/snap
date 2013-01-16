---
layout: post
title: "November 2012 Update"
description: "progress report for November 2012"
category: updates
tags: [update, progress, report]
---
{% include JB/setup %}

Introduction
============

Mathematical models of biological networks (bio-models) are important
biomedical research tools. The design, development, and curation of
these models may involve collaborations between a large number of
scientists within a research team or amongst the bio-modeling community
at large. However, no current tool provides the means to instantly share
and publish interactive models on the web.

To meet this need, [`snap`](http://stanley-gu.github.com/sbmlNodes/)
(SBML Network Ajax Publisher) is an SBML model viewer, editor, and
simulator that is written in JavaScript and can run entirely within a
web browser.

What is `snap` composed of?
---------------------------

-   **JavaScript libraries.** `snap` depends on open-source and actively
    developed libraries to produce a rich graphical user interface to
    load, manipulate, and simulate bio-models.

-   **`Node.js` server.** In order to use perform heavy server-side
    computation and use non-JavaScript libraries, `snap` uses a
    `node.js` backend. While a more traditional server technology could
    have been used, such as `Apache`, `node.js` was selected because its
    single-process, asynchronous-execution capabilities would allow for
    rapid communications between server and client that is necessary for
    interactive simulations. Furthermore, since `node.js` is implemented
    entirely in JavaScript, both the front-end and back-end, program
    logic can be reused on either end, and code maintenance and
    development is all in a single language.

-   **Built with `git`.** `Git` is used as a version control system in
    developing `snap`. Furthermore, `git` will be used for versioning
    and tracking model development.

Why is `snap` useful?
---------------------

-   **A no-install and always-updated, modeling platform.** The end user
    will never have to install any software

-   **Quickly view and interact with published models.** Mathematical
    models in scientific publications are often difficult to reproduce
    exactly, even if the underlying SBML is included with the
    publication. `snap` will allow a publication to directly link to a
    live and interactive version of their model.

-   **Always have models available on any computer.** Models can be
    stored and edited online, with version control of the model
    development done through `git`, like Google Docs for bio-models.

-   **Collaborate with other modelers.** Multiple users can work on
    building the same model and sharing experimental data.