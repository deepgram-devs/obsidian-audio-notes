import { Modal, App, Setting, Notice, request } from "obsidian";
import type { ApiKeyInfo } from "./AudioNotesSettings";
import { WHISPER_LANGUAGE_CODES } from "./utils";


export class EnqueueAudioModal extends Modal {
	url: string;

	constructor(app: App, private audioNotesApiKey: string, private apiKeyInfo: Promise<ApiKeyInfo | undefined>) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Add an mp3 file to transcribe" });

		this.apiKeyInfo.then((apiKeyInfo) => {
			if (apiKeyInfo) {
				new Setting(contentEl)
					.setName("URL to .mp3 file:")
					.setDesc("The .mp3 must be publicly available, so it cannot require a login or other authentication to access. The .mp3 file cannot be on your computer, it must be online.")
					.addText((text) =>
						text.onChange((value) => {
							this.url = value
						}));

				const baseOrHigher = ["BASE", "SMALL", "MEDIUM", "LARGE"];
				const smallOrHigher = ["SMALL", "MEDIUM", "LARGE"];
				const mediumOrHigher = ["MEDIUM", "LARGE"];
				const largeOrHigher = ["LARGE"];
				const select = contentEl.createEl("select", {
					cls: "select-model-accuracy"
				});
				const tiny = select.createEl("option");
				tiny.value = "Tiny";
				tiny.textContent = "Tiny";
				if (baseOrHigher.includes(apiKeyInfo.tier)) {
					const base = select.createEl("option");
					base.value = "Base";
					base.textContent = "Base";
					if (smallOrHigher.includes(apiKeyInfo.tier)) {
						const small = select.createEl("option");
						small.value = "Small";
						small.textContent = "Small";
						if (mediumOrHigher.includes(apiKeyInfo.tier)) {
							const medium = select.createEl("option");
							medium.value = "Medium";
							medium.textContent = "Medium";
							if (largeOrHigher.includes(apiKeyInfo.tier)) {
								const large = select.createEl("option");
								large.value = "Large";
								large.textContent = "Large";
							}
						}
					}
				}

				const selectLanguage = contentEl.createEl("select", {
					cls: "select-model-accuracy"
				});
				for (const langs of WHISPER_LANGUAGE_CODES) {
					const langCode = langs[0];
					const langName = langs[1];
					const option = selectLanguage.createEl("option");
					option.value = langCode;
					option.textContent = langName;
				}

				new Setting(contentEl)
					.addButton((btn) =>
						btn
							.setButtonText("Add to Queue")
							.setCta()
							.onClick(() => {
								if (select.value && this.url) {
									const splitUrl = this.url.split("?");
									const endsWithMp3 = splitUrl[0].endsWith(".mp3") || splitUrl[0].endsWith(".m4b") || splitUrl[0].endsWith(".m4a");
									if (endsWithMp3) {
										// Make the request to enqueue the item
										request({
											url: 'https://iszrj6j2vk.execute-api.us-east-1.amazonaws.com/prod/queue',
											method: 'POST',
											headers: {
												'x-api-key': this.audioNotesApiKey,
											},
											contentType: 'application/json',
											body: JSON.stringify({
												"url": this.url,
												"model": select.value.toUpperCase(),
												"language": selectLanguage.value.toLowerCase(),
											})
										}).then((r: any) => {
											new Notice("Successfully queued .mp3 file for transcription");
										}).finally(() => {
											this.close();
										});
									} else {
										new Notice("Make sure your URL is an .mp3, .m4b, or .m4a file. It should end in one of those extensions (excluding everything after an optional question mark).", 10000)
									}
								} else {
									new Notice("Please specify a .mp3 URL, an accuracy level, and a language.")
								}
							})
					);
			} else {
				contentEl.createEl("p", { text: "Please set a valid Audio Notes API key in the settings." });
				contentEl.createEl("p", { text: "If you do not have an API key, contact the maintainer of this plugin. See the README at https://github.com/jjmaldonis/obsidian-audio-notes for more information." });
			}
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
