import { z } from 'zod';
import type { Concept } from './concept';
import type { inferConceptModel } from './inference';
import { getConceptSchema } from './schema';
import { deserializeAppModel, serializeAppModel } from './serialization';

/**
 * 应用配置 - 创建自一个顶级`Concept`
 */
export interface App<TConcept extends Concept> {
    /**
     * 创建一个空白Model
     */
    createModel(): inferConceptModel<TConcept>;

    /**
     * 序列化一个Model
     */
    serializeModel(model: inferConceptModel<TConcept>): string;

    /**
     * 反序列化一个Model
     */
    loadModel(serialized: string): inferConceptModel<TConcept>;
}

class AppImpl<TConcept extends Concept> implements App<TConcept> {
    private readonly schema: z.ZodObject<z.ZodRawShape>;

    constructor(private concept: TConcept) {
        this.schema = this.createModelSchema();
    }

    createModel() {
        return { $concept: this.concept.name } as inferConceptModel<TConcept>;
    }

    private createModelSchema() {
        return getConceptSchema(this.concept);
    }

    serializeModel(model: inferConceptModel<TConcept>) {
        return serializeAppModel(
            this.schema.parse(model) as inferConceptModel<TConcept>
        );
    }

    loadModel(modelData: string) {
        const loaded = deserializeAppModel(modelData);
        return this.schema.parse(loaded) as inferConceptModel<TConcept>;
    }
}

/**
 * 创建一个App
 */
export function defineApp<TConcept extends Concept>(
    concept: TConcept
): App<TConcept> {
    return new AppImpl(concept);
}

const m = z.object({ $concept: z.string() });
