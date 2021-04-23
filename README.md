# js-icas
Javascript implementation of the Inter-Cranial Abstraction System

**Knowledge Graphs**
ICAS allows you to build graphs of calculations, relationships and workflows, then change your assumptions, import graph elements from others, and remix them.

**Academic Publishing**
All the data and functions in ICAS are content-addressable, allowing raw data and transformations on it to be unambiguously cited and verified. Allow others to reproduce your results and build on your work.

**Developers**
The vision is to allow your code to easily be re-mixed and re-used. Currently ony simple js programs and static types are supported. 

**Type Theory**
ICAS is a constructive type system for content-addressed functions. It is currently based on the following primitives:

* CIDs pointing to resources on IPFS
* Content objects defining a CID, the format of that CID, and optional metadata
* Types, which are functions with the signature `Content -> Bool` that define membership
* Executables which are content objects pointing to js code
* Functions, which contain a type signature consisting of `src` and `target` as well as an `executable`

In addition, there is a product type:

*Product type*

Instead of pointing to a CID defining type membership, this type has a `product` key `[A, B, ... N]`

This constructed type consists of a tuple of non-interacting base types: `A⊗B⊗...N`

There are also two flavors of function:

*Series functions*

In these functions, `exec` is replaced with `exec-series` which points to an array of functions `[f1, f2, f3, ... fn]`

These functions are interpreted as an end-to-end series: `f1 -> f2 -> f3 -> ... fn`

For a series function to be valid, for every function `fj` we need `f(j-1)_target = fj_src`

The type signature of a series function is `f1_src -> fn_target`

*Product functions*

In these functions, `exec` is replaced with `exec-product` which points to an array of functions `[f1, f2, f3, ... fn]`

These functions are interpreted as a set of non-interacting functions `{fi}` which run in parallel.

The type signature of a product function is `f1_src ⊗ f2_src ⊗ ... fn_src -> f1_target ⊗ f2_target ⊗ ... fn_target`

