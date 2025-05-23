import { Wordnet } from '../dist/src/wordnet.js';

Wordnet.dataDir = './downloads/dict';

const verb = Wordnet.findVerb('import');
const noun = Wordnet.findNoun('name');
const adj = Wordnet.findAdjective('good');
const adv = Wordnet.findAdverb('loudly');

const indexEntriesForAllForms = Wordnet.findAll('excuse');

indexEntriesForAllForms.forEach(indexEntry => {
    indexEntry.senses.forEach(sense => {
        if (sense.hypernym && sense.hypernym.length > 0) {
            console.log('hypernym for sense [%s]: [%s]', sense, sense.hypernym[0].word);
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
