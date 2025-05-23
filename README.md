# `wordnet-binary-search`

## SYNOPSIS

    import { Wordnet } from 'wordnet-binary-search';

    Wordnet.dataDir = './downloads/dict';

    const verb = Wordnet.findVerb('import');
    const noun = Wordnet.findNoun('name');
    const adj = Wordnet.findAdjective('good');
    const adv = Wordnet.findAdverb('loudly');

See [eg/eg.js](eg/eg.mjs): 

    node ./eg/eg.mjs

## INSTALL

    npm run download # Download and unpack the WordNet files into ./downloads/dict
    npm build
    npm test
    node eg/eg.js

## DESCRIPTION

- Performs fast binary searches upon [downloaded](https://wordnet.princeton.edu/download/current-version) copies of Wordnet 3.1 "database files"
- Automatic, lazy-loaded dereferencing of word senses and semantic pointers
- Basic object modelling of Wordnet in Typescript

## TODO

Lots, probably - it currently does what I want.

The Typescript modelling is rather limited at present.

The WordNet specs do not say if there can be more than one pointer of each type, so currently multiple are supported. This may change.

### POINTER REFERENCE

Pointers follow the Wordnet format, and are stored in `WithPointers.pointerMapEngToSymbol`, keyed by Wordnet word form identifier: `n` for noun, `v` for verb, `a` for adverb, `r` for adjective. Pointers can be dereferenced manually by calling the `derefPointer(symbol)` method upon the `Sense` object (where symbol is the Wordnet `pointer_symbol`, eg, `@i`), or by calling the dynamically-generated lazy-loaded memoised property of the `Sense` named after the `pointer_symbol` name (eg `instanceHypernym` for `@i`).

```ecma
    console.log(WithPointers.pointerMapEngToSymbol);

    {
        n: { // The pointer_symbols for nouns:
            antonym: '!',
            hypernym: '@',
            instanceHypernym: '@i',
            hypnym: '~',
            instanceHyponym: '~i',
            memberHolonym: '#m',
            substanceHolonym: '#s',
            partHolonym: '#p',
            memberMeronym: '%m',
            substanceMeronym: '%s',
            partMeronym: '%p',
            attribute: '=',
            derivationallyRelatedForm: '+',
            domainofSynsetTopic: ';c',
            memberofThisDomainTopic: '-c',
            domainofSynsetRegion: ';r',
            memberofThisDomainRegion: '-r',
            domainofSynsetUsage: ';u',
            memberofThisDomainUsage: '-u'
        },
        v: { // The pointer_symbols for verbs:
            antonym: '!',
            hypernym: '@',
            hypnym: '~',
            entailment: '*',
            cause: '>',
            alsoSee: '^',
            verbGroup: '$',
            derivationallyRelatedForm: '+',
            domainofSynsetTopic: ';c',
            domainofSynsetRegion: ';r',
            domainofSynsetUsage: ';u'
        },
        r: { // The pointer_symbols for adjectives:
            antonym: '!',
            similarTo: '&',
            participleOfVerb: '<',
            pertainym: '\\',
            attribute: '=',
            alsoSee: '^',
            domainofSynsetTopic: ';c',
            domainofSynsetRegion: ';r',
            domainofSynsetUsage: ';u'
        },
        a: {// The pointer_symbols for adverbs are:
            antonym: '!',
            derivedFromAdjective: '\\',
            domainofSynsetTopic: ';c',
            domainofSynsetRegion: ';r',
            domainofSynsetUsage: ';u'
        }
    };
```
