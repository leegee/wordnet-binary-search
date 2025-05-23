import { Wordnet } from '../dist/src/wordnet.js';

Wordnet.dataDir = './downloads/dict';

const verb = Wordnet.findVerb('import');
const noun = Wordnet.findNoun('name');
const adj = Wordnet.findAdjective('good');
const adv = Wordnet.findAdverb('loudly');

const indexEntriesForAllForms = Wordnet.findAll('excuse');

indexEntriesForAllForms.forEach(indexEntry => {
    indexEntry.senses.forEach(sense => {
        const firstHypernymWord = sense.hypernym?.[0]?.word;
        if (firstHypernymWord) {
            console.log('hypernym for sense [%s]: [%s]', sense, firstHypernymWord);
        } else {
            console.log('No hypernym for sense [%s]', sense);
        }
    });
});

const allUniqueOppositesOfImport = Array.from(new Set(
    Wordnet.findAll('import').flatMap(indexEntry =>
        indexEntry.senses.flatMap(sense =>
            sense.antonym ? [sense.antonym.toString()] : []
        )
    )
));

console.log(allUniqueOppositesOfImport);
