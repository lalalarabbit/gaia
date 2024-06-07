import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { app } from '../app';
import './pt-form-page';
import './pt-form-complete-page';
import { PtBaseShadow } from './pt-base';
import { provide } from '@lit/context';
import { formState, answerData } from '../state';
import { keyed } from 'lit/directives/keyed.js';
import { validateLogic } from '../util/logic-resolver';
import { ConceptRef } from '@gaia/configurator';

@customElement('pt-form')
export class PtForm extends PtBaseShadow {
    @property()
    name?: string;

    @property({
        type: Object,
        converter: {
            fromAttribute: (value: string | null) => {
                if (value === null) return undefined;
                app.loadModel(value);
                return app.model;
            },
        },
    })
    config?: typeof app.model;

    @state()
    private pageId: string = '';

    @provide({ context: formState })
    @state()
    formState: answerData = {};

    private pageIdStack: string[] = [];

    render() {
        console.log(this.config);

        const contentPages = this.config?.contentPages;

        if (!contentPages?.length) {
            return html``;
        }

        if (!this.pageId) {
            this.pageId = contentPages[0].$id;
        }

        const completePages = this.config?.completePages ?? [];

        const customCss = html`<style>
            h1 {
                text-align: center;
            }
        </style>`;

        const currentPage = contentPages.find((x) => x.$id === this.pageId);

        if (currentPage) {
            const showNextButton = this.shouldShowNextButton();

            console.log('showNextButton' + showNextButton);
            return html` <div>
                    ${keyed(
                        this.pageId,
                        html`<pt-form-page
                            @pt-form-state-changed=${this.onFormStateChange}
                            .page=${currentPage}
                        ></pt-form-page>`
                    )}
                </div>
                <div class="flex justify-center ">
                    <button
                        @click=${() => this.prePage()}
                        type="button"
                        class="min-h-[38px] min-w-[38px] py-2 px-2.5 inline-flex justify-center items-center gap-x-1.5 text-sm first:rounded-s-lg last:rounded-e-lg border border-gray-200 text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10"
                    >
                        <svg
                            class="flex-shrink-0 size-3.5"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m15 18-6-6 6-6"></path>
                        </svg>
                        <span class="hidden sm:block">Prev</span>
                    </button>
                    <button
                        @click=${() => this.nextPage()}
                        type="button"
                        class="${showNextButton
                            ? ''
                            : 'hidden'} min-h-[38px] min-w-[38px] py-2 px-2.5 inline-flex justify-center items-center gap-x-1.5 text-sm first:rounded-s-lg last:rounded-e-lg border border-gray-200 text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10"
                    >
                        <span class="hidden sm:block">Next</span>
                        <svg
                            class="flex-shrink-0 size-3.5"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </button>
                </div>`;
        } else {
            const completePage = completePages.find((x) => x.$id == this.pageId);
            return html`<pt-form-complete-page .page=${completePage!}></pt-form-complete-page>`;
        }
    }

    private onSubmit(e: Event) {
        console.log(`submit form data ${JSON.stringify(this.formState)}`);

        const options = {
            detail: this.formState,
            bubbles: true,
            composed: true,
        };

        this.dispatchEvent(new CustomEvent('pt-form-submit', options));
    }

    private prePage() {
        if (this.pageIdStack.length) {
            this.pageId = this.pageIdStack.pop()!;
        }
    }

    private nextPage() {
        this.pageIdStack.push(this.pageId);
        const contentPages = this.config?.contentPages!;
        const currentPage = contentPages.find((x) => x.$id == this.pageId);
        const nextButton = currentPage?.nextButton!;

        const nextAction = nextButton.action;

        if (nextAction == 'conditional') {
            const satisfiedCondition = nextButton.conditionalAction?.find((x) =>
                validateLogic(this.config!, x.condition!, this.formState)
            );
            if (satisfiedCondition) {
                const targePage = (satisfiedCondition.action![0].goToPage as ConceptRef).$id;
                this.pageId = targePage;
                return;
            }
        } else if (nextAction == 'goToPage') {
            const targePage = (nextButton.targetPage as ConceptRef).$id;
            this.pageId = targePage;
            return;
        }

        const currentPageIndex = contentPages.findIndex((x) => x.$id == this.pageId);

        if (currentPageIndex < contentPages.length - 1) {
            this.pageId = contentPages[currentPageIndex + 1].$id;
        } else {
            this.pageId = this.config?.completePages[0].$id!;
        }
    }

    private onFormStateChange() {
        console.log('form state changed');
        this.requestUpdate();
    }

    private shouldShowNextButton() {
        const currentPage = this.config?.contentPages.find((x) => x.$id == this.pageId);
        return currentPage?.pageItems.every((x) => !this.formState[x.$id] || this.formState[x.$id].isValid);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'pt-form': PtForm;
    }
}
