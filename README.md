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

