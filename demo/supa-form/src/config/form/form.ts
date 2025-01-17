import { type BaseConceptModel, Concept, ConfigItem, defineConcept, NonPrimitiveTypes } from '@hayadev/configurator';
import { CodeLanguage } from '@hayadev/configurator/items';
import { ChoiceQuestion, ImageElement, TextElement } from '../page-items';
import { CompletePage } from '../page/complete-page';
import { ContentPage } from '../page/content-page';
import { DataCollectionSetting } from './data-collection-setting';
import { LanguageSetting } from './language-setting';

/**
 * 表单
 */
export const Form = defineConcept({
    name: 'Form',
    displayName: '表单',
    description: 'Survey form',

    groups: {
        contentPages: { name: '表单页', aspect: 'content' },
        completePages: { name: '结束页', aspect: 'content' },
        language: { name: '语言', aspect: 'setting' },
        dataCollection: { name: '表单信息收集', aspect: 'setting' },
        style: { name: '样式', aspect: 'design' },
    },

    items: {
        /**
         * 表单页列表，inline展示
         */
        contentPages: {
            type: 'has-many',
            name: '表单页',
            description: 'Pages for collecting user input',
            required: true,
            candidates: [ContentPage],
            inline: true,
            groupKey: 'contentPages',
            newItemProvider: (concept, context) => {
                const { app, currentModel } = context;
                const existing = currentModel?.filter((item: BaseConceptModel) => item.$concept === concept.name) ?? [];
                return app.createConceptInstance(ContentPage, {
                    name: `表单页${existing.length + 1}`,
                    pageItems: [
                        app.createConceptInstance(ChoiceQuestion, {
                            name: '选择1',
                            question: '选择1',
                        }),
                    ],
                });
            },
        },

        /**
         * 结束页列表，inline展示
         */
        completePages: {
            type: 'has-many',
            name: '结束页',
            description: 'Pages for confirming form submission and thanking the user',
            candidates: [CompletePage],
            inline: true,
            groupKey: 'completePages',
            newItemProvider: (concept, context) => {
                const { app, currentModel } = context;
                const existing = currentModel?.filter((item: BaseConceptModel) => item.$concept === concept.name) ?? [];
                return app.createConceptInstance(CompletePage, {
                    name: `结束页${existing.length + 1}`,
                    pageItems: [
                        app.createConceptInstance(TextElement, {
                            content: '标题',
                        }),
                        app.createConceptInstance(ImageElement, {
                            image: { $type: 'image' },
                        }),
                        app.createConceptInstance(TextElement, {
                            content: '说明文字',
                        }),
                    ],
                });
            },
        },

        /**
         * 语言设置
         */
        languageSettings: LanguageSetting,

        /**
         * 表单信息收集
         */
        dataCollection: DataCollectionSetting,

        /**
         * 自定义CSS
         */
        customCSS: {
            type: 'code',
            name: '自定义CSS',
            language: CodeLanguage.CSS,
            groupKey: 'style',
        },
    },

    import: (data, { app }) => {
        // add $type to data (recursively) if missing
        fixMissingValueTypeForConcept(app.concept, data);

        return { success: true, model: data as any };
    },
});

function fixMissingValueTypeForConcept(concept: Concept, data: any) {
    if (!data || typeof data !== 'object') {
        return;
    }
    Object.entries(concept.items).forEach(([key, item]) => {
        fixMissingValueTypeForItem(item, data[key]);
    });
}

function fixMissingValueTypeForItem(item: ConfigItem, data: any) {
    if (!data) {
        return;
    }

    switch (item.type) {
        case 'code': {
            fixDataType(data, NonPrimitiveTypes.code);
            break;
        }

        case 'image': {
            fixDataType(data, NonPrimitiveTypes.image);
            break;
        }

        case 'group': {
            fixDataType(data, NonPrimitiveTypes.itemGroup);
            // recurse
            Object.entries(item.items).forEach(([key, subItem]) => fixMissingValueTypeForItem(subItem, data[key]));
            break;
        }

        case 'if': {
            // recurse
            fixMissingValueTypeForItem(item.child, data);
            break;
        }

        case 'has': {
            fixDataType(data, NonPrimitiveTypes.concept);
            // recurse
            fixMissingValueTypeForConcept(item.concept, data);
            break;
        }

        case 'has-many': {
            if (Array.isArray(data)) {
                data.forEach((subData) => {
                    fixDataType(subData, NonPrimitiveTypes.concept);
                    if (typeof subData.$concept === 'string') {
                        // find the concept of the element
                        const subConcept = item.candidates.find((c) => c.name === subData.$concept);
                        if (subConcept) {
                            // recurse
                            fixMissingValueTypeForConcept(subConcept, subData);
                        }
                    }
                });
            }
        }
    }
}

function fixDataType(data: any, type: NonPrimitiveTypes) {
    if (typeof data === 'object' && !data.$type) {
        console.log(`Fixing missing $type to "${type}" in ${JSON.stringify(data)}`);
        data.$type = type;
    }
}
