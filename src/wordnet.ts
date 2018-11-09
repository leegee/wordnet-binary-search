import * as fs from 'fs';
import { Console } from 'console';
import * as devnull from 'dev-null';
import { join } from 'path';
import { Logger } from 'log4js';

/**
 * @see https://wordnet.princeton.edu/documentation/wninput5wn
 * @see https://wordnet.princeton.edu/documentation/wndb5wn

 */

export class Pointer {
    pointerSymbol: string;
    synsetOffset: number;
    pos: string;
    source: string; // two-digit hex
    target: string; // two-digit hex

    constructor(
        pointerSymbol: string,
        synsetOffset: number,
        pos: string,
        sourceTarget: string
    ) {
        this.pointerSymbol = pointerSymbol;
        this.synsetOffset = synsetOffset;
        this.pos = pos;
        this.source = sourceTarget.substr(0, 2);
        this.target = sourceTarget.substr(2, 2);
    }

    static fromLineFields(pCnt: number, parts: string[]): Pointer[] {
        const ptrs: Pointer[] = [];
        for (let i = 1; i <= pCnt; i++) {
            ptrs.push(
                new Pointer(
                    parts.shift(),
                    Number(parts.shift()),
                    parts.shift(),
                    parts.shift()
                )
            );
        }
        return ptrs;
    }
}

class WithPointers {
    /**
     * First-level is keyed by the word form -- what Wordnet calls  `pos` or `ssType`.
     * Second-level is keyed by phrase taken from then `wninput(WN5)` document.
     */
    static pointerMapEngToSymbol: { [key: string]: { [key: string]: string } } = {
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

    _derefedPointer: { [key: string]: Sense[] } = {};
    synsetOffsets: number[] = [];

    addPointerAccessors() {
        const ssTypePos = this['pos'] || this['ssType'];
        Object.keys(WithPointers.pointerMapEngToSymbol[ssTypePos]).forEach(englishKey => {
            Object.defineProperty(this, englishKey, {
                get: () => this.derefPointer(
                    WithPointers.pointerMapEngToSymbol[ssTypePos][englishKey]
                )
            });
        });
    }

    /**
     * Dereferences the entry's semantic pointers from the entry's sense definitions,
     * as identified by their `wininput(5WN)` pointer symbol.
     * 
     * @param ptrSymbol Pointer symbol.
     * @returns Sense[]
     * @see 'Pointers' in  https://wordnet.princeton.edu/documentation/wninput5wn
     */
    derefPointer(ptrSymbol: string): Sense[] {
        if (!this._derefedPointer[ptrSymbol]) {
            this._derefedPointer[ptrSymbol] = [];
            const pointers = this.hasOwnProperty('senses') ? this['senses'].map(sense => sense.pointers) : this['pointers'];
            pointers.filter(ptr => ptr.pointerSymbol === ptrSymbol).forEach(ptr => {
                this._derefedPointer[ptrSymbol].push(
                    Sense.fromPointer(ptr)
                );
            });
        }
        return this._derefedPointer[ptrSymbol].length ? this._derefedPointer[ptrSymbol] : null;
    }
}

/**
 * Entries in the Wordnet `index.*` files, whose format in 3.1 is as follows:
 *
 *  `lemma  pos  synset_cnt  p_cnt  [ptr_symbol...]  sense_cnt  tagsense_cnt   synset_offset  [synset_offset...]`
 */
export class IndexEntry extends WithPointers {
    word: string; // lemma
    pos: string; // pos
    synsetCnt: number;
    pCnt: number;
    pointers: string[] = [];
    tagsenseCnt: number;
    synsetOffsets: number[] = [];
    _senses: Sense[] = [];

    /**
     *
     * @param line The line from an `index.*` "database file".
     */
    constructor(line: string) {
        super();
        const parts = line.trim().split(/\s+/);
        this.word = parts.shift();
        this.pos = parts.shift();
        this.synsetCnt = Number(parts.shift());

        this.pCnt = Number(parts.shift());
        for (let i = 0; i < this.pCnt; i++) {
            this.pointers.push(parts.shift());
        }
        // this.pointers = Pointer._fromLineFields(this.pCnt, parts)

        parts.shift();  // sense_cnt same as synset count: senses are at EOL

        this.tagsenseCnt = Number(parts.shift());
        this.synsetOffsets = parts.map(i => Number(i));

        this.addPointerAccessors();
    }

    toString(): string {
        return this.word.replace('_', ' ');
    }

    /**
     * Dereferences the entry's senses.
     * @returns Sense[]
     */
    get senses(): Sense[] {
        if (!this._senses.length) {
            this.synsetOffsets.forEach(synsetOffset => {
                this._senses.push(
                    Sense.fromSynsetOffset(synsetOffset, this.pos)
                    // Wordnet.dataFiles[this.pos]._getSense(synsetOffset)
                );
            })
        }
        return this._senses;
    }
}

// synset_offset  lex_filenum  ss_type  w_cnt  word  lex_id  [word  lex_id...]  p_cnt  [ptr...]  [frames...]  |   gloss
export class Sense extends WithPointers {
    synsetOffset: number;
    lexFilenum: number;
    ssType: string; // aka pos
    wCnt: number;
    word: string;
    lexId: string; // 1-digit hex
    pCnt: number; // 3-digit decimal
    pointers: Pointer[];
    franes: string; // TODO: see 'Verb Frames' in https://wordnet.princeton.edu/documentation/wninput5wn
    gloss: string;

    /**
     * Constructs a new `Sense` object.
     * 
     * @param synsetOffset Numeric offset taken from the index.
     * @param posSstype  The index/data type 
     * @return A new Sense
     */
    static fromSynsetOffset(synsetOffset: number, posSstype: string) {
        return Sense.fromLine(
            Wordnet.dataFiles[posSstype].getLineBySynsetOffset(synsetOffset)
        );
    }

    /**
     * Constructs a new `Sense` object instantiated from the supplied `Pointer`.
     * 
     * @param ptr Pointer
     * @return A new Sense
     */
    static fromPointer(ptr: Pointer): Sense {
        return Sense.fromLine(
            Wordnet.dataFiles[ptr.pos].getLineBySynsetOffset(ptr.synsetOffset)
        );
    }

    /**
     * * Constructs a new `Sense` object.
     * 
     * @param line A line from a `data.*` file.
     */
    static fromLine(line: string): Sense {
        const self = new Sense();
        line = line.trimRight();

        let parts = line.split(/\s*\|\s*/, 2);
        self.gloss = parts[1];

        parts = line.split(' ');

        self.synsetOffset = Number(parts.shift());
        self.lexFilenum = Number(parts.shift());
        self.ssType = parts.shift();
        self.wCnt = Number(parts.shift());
        self.word = parts.shift();
        self.lexId = parts.shift();

        // Remove (or do what with?) additional word/lexId pairs:
        // iterate whilst next part is not a pCnt 3-digit decimal integer:
        while (!parts[0].match(/^\d{3}$/)) {
            parts.shift(); // word
            parts.shift(); // lexId
        }

        const pCnt = parts.shift();
        self.pCnt = Number(pCnt);
        if (isNaN(self.pCnt)) {
            throw new Error('pCnt NaN:' + pCnt + '\n' + line + '\nword=' + self.word);
        }

        self.pointers = Pointer.fromLineFields(self.pCnt, parts);
        self.addPointerAccessors();
        return self;
    }

    toString(): string {
        return this.word.replace('_', ' ');
    }
}


export class SourceFile {
    static descriptorCache: { [key: string]: number } = {};

    suffix: string;
    type: string; // aka pos, ssType
    path: string;
    fd: number;

    constructor(suffix: string, type: string, filepath: string) {
        this.suffix = suffix;
        this.type = type;
        this.path = filepath;
        if (!SourceFile.descriptorCache.hasOwnProperty(this.path)) {
            SourceFile.descriptorCache[this.path] = fs.openSync(this.path, 'r');
        }
        this.fd = SourceFile.descriptorCache[this.path];
    }
}


export class DataFile extends SourceFile {
    static INPUT_BUFFER_READ_LINE_SIZE = 1024;

    /**
     * Returns a Wordnet sense object representing the line at `synsetOffest`.
     * @param synsetOffset The line offset in the `data.${this.type}` file.
     */
    // _getSense(synsetOffset: number): Sense {
    //     Wordnet.logger.debug('getSense for pos [%s] synset [%d]', this.type, synsetOffset);
    //     const line = this._getLineBySynsetOffset(synsetOffset);
    //     Wordnet.logger.debug('Got line: ', line);
    //     return Sense.fromLine(line);
    // }

    getLineBySynsetOffset(synsetOffset: number): string {
        Wordnet.logger.debug('Datafile.getLineBySynsetOffset [%d]', synsetOffset);
        if (!synsetOffset || typeof synsetOffset !== 'number') {
            throw new TypeError('Expected a synsetOffset as a Number');
        }
        let readFrom = synsetOffset;
        const inputBuffer = Buffer.alloc(DataFile.INPUT_BUFFER_READ_LINE_SIZE);
        fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, readFrom);
        let line = inputBuffer.toString();

        while (line.indexOf('\n') === -1) {
            readFrom += DataFile.INPUT_BUFFER_READ_LINE_SIZE;
            Wordnet.logger.debug('Read more from %d...', readFrom);
            fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, readFrom);
            line = line + inputBuffer.toString();
            Wordnet.logger.debug('...line now [%s]', line);
        }

        line = line.substring(0, line.indexOf('\n')).trimRight();
        Wordnet.logger.debug('RV [%s]', line);
        return line;
    }
}


export class IndexFile extends SourceFile {
    static INPUT_BUFFER_READ_LINE_SIZE = 127;

    /**
    * Returns a index entry for the supplied word.
    * @param subject Word sought.
    * @return IndexEntry or `null`
    */
    getEntry(subject: string): IndexEntry | null {
        Wordnet.logger.debug('getEntry %s', subject);
        const stats = fs.fstatSync(this.fd);
        return this._find(
            subject.toLocaleLowerCase(),
            Buffer.alloc(IndexFile.INPUT_BUFFER_READ_LINE_SIZE),
            Math.floor(stats.size / 2),
            stats.size
        );
    }

    /*
     * Binary search.

     * @param subject The subject of the search.
     * @param inputBuffer Preallocated input buffer.
     * @param pos Current position within the intput file.
     * @param totalLength Total length of the file.
     */
    _find(
        subject: string,
        inputBuffer: Buffer,
        pos: number,
        totalLength: number
    ): IndexEntry | null {
        inputBuffer = inputBuffer.fill('');
        fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, pos);
        Wordnet.logger.debug('\nFor [%s] Read from %d / %d:\n%s\n', subject, pos, totalLength, inputBuffer);

        const inputStr = inputBuffer.toString();
        const m = inputStr.match(/\n(([a-z_-]+)(.+?))\s*\n/);

        if (!m) {
            IndexFile.INPUT_BUFFER_READ_LINE_SIZE = Math.floor(IndexFile.INPUT_BUFFER_READ_LINE_SIZE * 1.5);
            inputBuffer = Buffer.alloc(IndexFile.INPUT_BUFFER_READ_LINE_SIZE);
            Wordnet.logger.debug('Increasing buffer size for [%s] to by f1.5 to ', subject, IndexFile.INPUT_BUFFER_READ_LINE_SIZE);
        } else {
            const [, line, indexWord] = m;
            const comparision = subject.localeCompare(indexWord);
            Wordnet.logger.debug('Checking line [%s] === [%d]', line, comparision);

            if (comparision === 0) {
                Wordnet.logger.debug('FOUND [%s] as [%s] IN LINE [%s]', subject, indexWord, line);
                return new IndexEntry(line);
            }

            if (comparision < 0) {
                totalLength = pos;
                pos = Math.floor(pos = pos / 2);
                Wordnet.logger.debug('<', pos);
            } else {
                pos = pos + Math.floor((totalLength - pos) / 2);
                Wordnet.logger.debug('>', pos, totalLength);
            }

            if (totalLength - pos <= IndexFile.INPUT_BUFFER_READ_LINE_SIZE) {
                Wordnet.logger.debug(
                    'totalLength %d - pos %d <= IndexFile.INPUT_BUFFER_READ_LINE_SIZE %d',
                    totalLength, pos, IndexFile.INPUT_BUFFER_READ_LINE_SIZE
                );
                IndexFile.INPUT_BUFFER_READ_LINE_SIZE = Math.floor(IndexFile.INPUT_BUFFER_READ_LINE_SIZE * 0.8);
                if (IndexFile.INPUT_BUFFER_READ_LINE_SIZE < 10) {
                    Wordnet.logger.debug('Buffer reduced to ', IndexFile.INPUT_BUFFER_READ_LINE_SIZE);
                    return null;
                }
            } else if (pos >= totalLength || pos <= 0) {
                Wordnet.logger.warn('Not found', subject, pos, totalLength);
                return null;
            }
        }

        Wordnet.logger.trace('Recurse for [%s] at pos %d / %d ', subject, pos, totalLength);
        return this._find(subject, inputBuffer, pos, totalLength);
    }
}

// tslint:disable-next-line:no-shadowed-variable
export class Wordnet {
    static dataDir: string;

    static get indexFiles(): { [key: string]: IndexFile } {
        return {
            r: new IndexFile('adj', 'r', Wordnet.dataDir + '/index.adj'),
            a: new IndexFile('adv', 'a', Wordnet.dataDir + '/index.adv'),
            n: new IndexFile('noun', 'n', Wordnet.dataDir + '/index.noun'),
            v: new IndexFile('verb', 'v', Wordnet.dataDir + '/index.verb')
        }
    };

    static get dataFiles(): { [key: string]: DataFile } {
        return {
            r: new DataFile('adj', 'r', Wordnet.dataDir + '/data.adj'),
            a: new DataFile('adv', 'a', Wordnet.dataDir + '/data.adv'),
            n: new DataFile('noun', 'n', Wordnet.dataDir + '/data.noun'),
            v: new DataFile('verb', 'v', Wordnet.dataDir + '/data.verb')
        }
    };

    static _logger = new Console({
        // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30339
        // @ts-ignore
        stderr: devnull(),
        stdout: devnull()
    });

    static set logger(userSuppliedLogger) {
        this._logger = userSuppliedLogger;
    }

    static get logger() {
        return Wordnet._logger;
    }

    static _prepare(subject: string): string {
        return subject.toLocaleLowerCase().replace(/\s+/, '_');
    }

    /**
     * Find the index entry for a specified form a word.
     * 
     * @param subject The word sought.
     * @param filetypeKeys? Optinal - One or more forms for which to search.
     * @param IndexEntry[] 
     * @see IndexFile#find
     */
    static find(subject: string, ...filetypeKeys: string[]): IndexEntry | IndexEntry[] | null {
        filetypeKeys = (!filetypeKeys || filetypeKeys.length) ? filetypeKeys : Object.keys(this.indexFiles);
        const rv: IndexEntry[] = filetypeKeys
            .filter(type => this.indexFiles.hasOwnProperty(type))
            .map(type => this.indexFiles[type].getEntry(
                Wordnet._prepare(subject)
            ))
            .filter((word: IndexEntry) => word !== null);;
        return rv.length === 0 ? null : filetypeKeys.length === 1 ? (rv[0] || null) : rv;
    }

    /**
     * Finds index entries for all forms of a word.
     * 
     * @param subject The word sought.
     */
    static findAll(subject: string): IndexEntry[] | null {
        return this.find(subject) as IndexEntry[];
    }
}
