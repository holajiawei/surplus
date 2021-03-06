import { LOC } from './parse';

// 'kind' properties are to make sure that Typescript treats each of these as distinct classes
// otherwise, two classes with same props, like the 4 with just code / loc, are treated
// as interchangeable

export class Program {
    kind = 'program' as 'program';
    constructor(
        public segments : CodeSegment[]
    ) { }
}

export type CodeSegment = CodeText | JSXElement;

export class CodeText { 
    kind = 'code' as 'code';
    constructor(
        public readonly text : string, 
        public readonly loc : LOC
    ) { }
}

export class EmbeddedCode {
    kind = 'embeddedcode' as 'embeddedcode';
    constructor(
        public readonly segments : CodeSegment[]
    ) { }
}

export type JSXProperty = JSXStaticProperty | JSXDynamicProperty | JSXStyleProperty | JSXSpreadProperty;
export type JSXContent = JSXElement | JSXComment | JSXText | JSXInsert;

export class JSXElement {
    kind = 'element' as 'element';
    constructor(
        public readonly tag : string, 
        public readonly properties : JSXProperty[], 
        public readonly references : JSXReference[],
        public readonly functions : JSXFunction[],
        public readonly content : JSXContent[],
        public readonly loc : LOC
    ) { }    

    private static domTag = /^[a-z][^\.]*$/;
    isHTML = JSXElement.domTag.test(this.tag);
}

export class JSXText {
    kind = 'text' as 'text';
    constructor(
        public readonly text : string
    ) { }
}

export class JSXComment {
    kind = 'comment' as 'comment';
    constructor(
        public readonly text : string
    ) { }
}

export class JSXInsert {
    kind = 'insert' as 'insert';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXStaticProperty {
    kind = 'staticprop' as 'staticprop';
    constructor(
        public readonly name : string, 
        public readonly value : string
    ) { }
}

export class JSXDynamicProperty {
    kind = 'dynamicprop' as 'dynamicprop';
    constructor(
        public readonly name : string, 
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXSpreadProperty {
    kind = 'spread' as 'spread';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXStyleProperty {
    kind = 'style' as 'style';
    name = "style";
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXReference {
    kind = 'reference' as 'reference';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXFunction {
    kind = 'function' as 'function';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

// a Copy transform, for building non-identity transforms on top of
export const Copy = {
    Program(node : Program) {
        return new Program(this.CodeSegments(node.segments));
    },
    CodeSegments(segments : CodeSegment[]) {
        return segments.map(node => 
            node instanceof CodeText ? this.CodeText(node) : 
            this.JSXElement(node));
    },
    EmbeddedCode(node : EmbeddedCode) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement(node : JSXElement) : JSXElement {
        return new JSXElement(node.tag, 
            node.properties.map(p => this.JSXProperty(p)),
            node.references.map(r => this.JSXReference(r)),
            node.functions.map(f => this.JSXFunction(f)),
            node.content.map(c => this.JSXContent(c)),
            node.loc
        );
    },
    JSXProperty(node : JSXProperty) {
        return node instanceof JSXStaticProperty  ? this.JSXStaticProperty(node) :
               node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
               node instanceof JSXStyleProperty ? this.JSXStyleProperty(node) :
               this.JSXSpreadProperty(node);
    },
    JSXContent(node : JSXContent) {
        return node instanceof JSXComment ? this.JSXComment(node) :
               node instanceof JSXText    ? this.JSXText(node) :
               node instanceof JSXInsert  ? this.JSXInsert(node) :
               this.JSXElement(node);
    },
    JSXInsert(node : JSXInsert) {
        return new JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText(node : CodeText) { return node; },
    JSXText(node : JSXText) { return node; },
    JSXComment(node : JSXComment) { return node; },
    JSXStaticProperty(node : JSXStaticProperty) { return node; },
    JSXDynamicProperty(node : JSXDynamicProperty) {
        return new JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty(node : JSXSpreadProperty) {
        return new JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXStyleProperty(node : JSXStyleProperty) {
        return new JSXStyleProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXReference(node : JSXReference) {
        return new JSXReference(this.EmbeddedCode(node.code), node.loc);
    },
    JSXFunction(node : JSXFunction) {
        return new JSXFunction(this.EmbeddedCode(node.code), node.loc);
    }
};

export type Copy = typeof Copy;
