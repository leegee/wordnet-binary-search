# `wordnet-binary-search`

## SYNOPSIS

    import { Wordnet } from 'wordnet-binary-search';

    Wordnet.Wordnet.dataDir = 'downloaded/wordnet-db');

    const importVerbIndexEntry = Wordnet.Wordnet.getIndexEntry('import', 'v');

    const antonymOfImportVerb1 = importVerbIndexEntry['antonym'];
    const antonymOfImportVerb2 = importVerbIndexEntry.derefPointer('!');

    const indexEntriesForAllFormsOfExcuse = Wordnet.Wordnet.getIndexEntries('excuse');
    indexEntriesForAllFormsOfExcuse.forEach( indexEntry => {
        const senses = indexEntry.wordnetSenses;
        senses.forEach( sense => console.log(sense) );
    });

## DESCRIPTION

* binary searches upon your downloaded copies of Wordnet 3.1 "database files"
* basic object modelling of Wordnet in Typescript
* automatic, lazy-loaded  dereferencing of word senses and semantic pointers

### POINTER REFERENCE

Following the Wordnet format:

```
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
