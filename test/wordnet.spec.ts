import path from 'path';
import fs from 'fs';

import { expect } from 'chai';

import log4js from '@log4js-node/log4js-api';

import { Wordnet, IndexEntry, Sense, Pointer } from '../src/wordnet';

Wordnet.logger = log4js.getLogger();
Wordnet.logger.level = 'error';

Wordnet.setDataDir(path.resolve('assets/wordnet'));

describe('Wordnet', () => {
  it('inits data file paths', () => {
    Object.keys(Wordnet.dataFiles).forEach(filetypeKey => {
      expect(
        fs.existsSync(Wordnet.dataFiles[filetypeKey].path),
        fs.existsSync(Wordnet.dataFiles[filetypeKey].path) + ' exists'
      ).to.equal(true);
    });
  });

  describe('Verb Index', () => {
    let verbIndexEntry;

    before(() => {
      verbIndexEntry = Wordnet.findVerb('import');
    });

    it('finds verb "import"', () => {
      expect(verbIndexEntry).to.be.an.instanceof(IndexEntry);
      expect(verbIndexEntry).to.deep.equal({
        synsetOffsets: [2346136, 2232722, 932636],
        pointerSymbolStrings: ['!', '@', '~', '+', ';'],
        _senses: [],
        derefCache: {},
        word: 'import',
        pos: 'v',
        synsetCnt: 3,
        pCnt: 5,
        tagsenseCnt: 1
      });
    });

    it('loads all entries for "import"', () => {
      const definitions = verbIndexEntry.senses;
      expect(definitions).to.be.an.instanceof(Array);
      expect(definitions).to.have.length(3);
      definitions.forEach(def => {
        expect(def).to.be.an.instanceof(Sense);
        expect(def.word).to.match(/import|spell/); // wordnet bug?
      });
    });
  });

  describe('DataFile', () => {
    it('finds line by synset offset', async () => {
      const line = Wordnet.dataFiles.v.getLineBySynsetOffset(2346409);
      expect(line).to.equal(
        '02346409 40 v 01 export 0 009 @ 02260362 v 0000 ;c 01090446 n 0000 + 03306207 n 0102 + 01111952 n 0102 + 03306207 n 0101 + 10073634 n 0101 + 01111952 n 0101 ! 02346136 v 0101 ~ 02345856 v 0000 03 + 08 00 + 16 00 + 21 00 | sell or transfer abroad; "we export less than we import and have a negative trade balance"'
      );
    });
  });

  describe('Sense', () => {
    it('from line found by synset offset', async () => {
      const line = Wordnet.dataFiles.v.getLineBySynsetOffset(2346409);
      const sense = new Sense(line);
      expect(sense).to.be.an.instanceof(Sense);
      expect(sense.word).to.equal('export');
      expect(sense.synsetOffset).to.equal(2346409);
      expect(sense.wCnt).to.equal(1);
      expect(sense.pCnt).to.equal(9);
      expect(sense.lexId).to.equal('0');
      expect(sense.lexFilenum).to.equal(40);
      expect(sense.pointers).to.be.an.instanceof(Array);
      expect(sense.pointers).to.have.lengthOf(sense.pCnt);
      sense.pointers.forEach(ptr => {
        expect(ptr).to.be.an.instanceof(Pointer);
      });
      expect(sense.gloss).to.equal(
        'sell or transfer abroad; "we export less than we import and have a negative trade balance"'
      );
    });
  });

  describe('forms', () => {
    it('finds all forms of  "excuse"', () => {
      const indexEntries = Wordnet.findAll('excuse');
      expect(indexEntries).to.be.an.instanceof(Array);
      expect(indexEntries).to.have.length(2);
      indexEntries.forEach(indexEntry => {
        expect(indexEntry).to.be.an.instanceof(IndexEntry);
        expect(indexEntry.word).to.equal('excuse');
        const senses = indexEntry.senses;
        expect(senses).to.be.an.instanceof(Array);
        senses.forEach(sense => {
          expect(sense).to.be.an.instanceof(Sense);
        });
      });
    });
  });

  describe('antonyms', () => {
    const testSense = (sense) => {
      const antonym = sense.antonym;

      if (antonym.length > 0) {
        expect(antonym).to.be.an.instanceof(Array);
        expect(antonym[0]).to.be.an.instanceof(Sense);
        expect(antonym[0].word).to.be.a('string');
        expect(antonym[0].word).to.equal('export');
      }
    };

    it('finds the opposite of verb "import"', () => {
      const indexEntry = Wordnet.findVerb('import');

      expect(indexEntry).not.to.be.an.instanceOf(Array);

      indexEntry.senses.forEach(sense => {
        testSense(sense);
      });
    });

    it('finds the opposites of all forms of  "import"', () => {
      Wordnet.findAll('import').forEach(indexEntry => {
        indexEntry.senses.pop();
        indexEntry.senses.forEach(sense => {
          testSense(sense);
        });
      });
    });
  });

  describe('hypernym', () => {
    it('finds the hypernym of a verb', () => {
      const indexEntry = Wordnet.findVerb('fool');

      expect(indexEntry).not.to.be.an.instanceOf(Array);

      expect(indexEntry).to.be.an.instanceof(IndexEntry);
      expect(indexEntry.senses).to.have.length(4);
      expect(indexEntry.senses[0]).to.be.an.instanceOf(Sense);
      expect(indexEntry.senses[0].word).to.equal('fool');
      expect(indexEntry.senses[0].pCnt).to.equal(4);
      expect(indexEntry.senses[0].pointers).to.have.length(4);
      expect(indexEntry.senses[0].pointers[0].pos).to.equal('v');
      expect(indexEntry.senses[0].pointers[0].synsetOffset).to.equal(2575082);
      expect(indexEntry.senses[0].pointers[0].pointerSymbol).to.equal('@');
      expect(indexEntry.senses[0].hypernym).to.be.an('array').that.is.not.empty;
      expect(indexEntry.senses[0].hypernym![0].word).to.equal('deceive');
    });

    it('finds the hypernym of a verb from all forms', () => {
      const indexEntries = Wordnet.findAll('fool');
      expect(indexEntries).to.be.an.instanceof(Array);
      indexEntries.forEach(indexEntry => {
        expect(indexEntry).to.be.an.instanceof(IndexEntry);
        expect(indexEntry.senses).to.have.length.greaterThan(0);
        expect(indexEntry.senses[0]).to.be.an.instanceOf(Sense);
        expect(indexEntry.senses[0].word).to.have.length.greaterThan(0);
        // indexEntry.senses[0].word
        indexEntry.senses.forEach(sense => {
          Wordnet.logger.info('Hypernym for "fool" (sense "[%s]"): [%s]',
            sense,
            sense.hypernym?.[0] ?? 'undefined'
          );
        });
      });
    });
  });
});
