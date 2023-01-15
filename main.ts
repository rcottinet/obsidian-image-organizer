import { App, TFile, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


const DEFAULT_HANDLED_FILE_EXTENSION: Record<string, boolean> = {
	'jpg': true,
	'pdf': true,
	'jpeg': true,
	'png': true
}

const DEFAULT_TARGET_OPTIONS: Record<string, string> = {
	'root': 'Root Folder',
	'activeFolder': 'Active Folder'
}

interface ImageOrganizerPluginSettings {
	selectedTarget: string,
	targetFolder: string;
	targetOptions: Record<string, string>,
	handledFileExtension: Record<string, boolean>,
}

const DEFAULT_SETTINGS: ImageOrganizerPluginSettings = {
	selectedTarget: 'activeFolder',
	targetOptions: DEFAULT_TARGET_OPTIONS,
	targetFolder: 'media',
	handledFileExtension: DEFAULT_HANDLED_FILE_EXTENSION
}

export default class ImageOrganizerPlugin extends Plugin {
	settings: ImageOrganizerPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(app.vault.on('create', (file: TFile) => {

			/**
			 * Check if the file extension is handle by the plugin 
			 * and if extension setting is activated
			 */
			if (!Object.values(Object.keys(this.settings.handledFileExtension)).includes(file.extension)
				|| !this.settings.handledFileExtension[file.extension]) {
				return
			}

			/**
			 * Getting the active file to get the current path
			 */


			let activeFile = app.workspace.getActiveFile();
			if (!activeFile) {
				return
			}

			let rootFolder = '';
			let activeFolder = activeFile.parent.path || rootFolder;

			let targetPath = this.settings.selectedTarget == 'activeFolder' ? activeFolder : rootFolder;

			/**
			 * Adding to the target path the folder specify or no in plugin setting
			 */
			if (this.settings.targetFolder.length > 0) {
				targetPath += '/' + this.settings.targetFolder;
			}

			if (!app.vault.getAbstractFileByPath(targetPath)) {
				app.vault.createFolder(targetPath).then(() => {
					app.vault.rename(file, targetPath + '/' + file.name)
						.then(() => new Notice("File successfully add to " + targetPath))
				})
			} else {
				app.vault.rename(file, targetPath + '/' + file.name)
					.then(() => new Notice("File successfully add to " + targetPath))
			}
		}));

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ImageOrganizerPluginSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ImageOrganizerPluginSettingTab extends PluginSettingTab {
	plugin: ImageOrganizerPlugin;

	constructor(app: App, plugin: ImageOrganizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for Image Organizer Plugin' });

		new Setting(containerEl)
			.setName('Save media into')
			.addDropdown(cb => cb
				.addOptions(this.plugin.settings.targetOptions)
				.setValue(this.plugin.settings.selectedTarget)
				.onChange(async (value) => {
					this.plugin.settings.selectedTarget = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Target folder')
			.setDesc("Folder where file will be saved. \n Leave empty if you don't want to use a folder")
			.addText(text => text
				.setValue(this.plugin.settings.targetFolder)
				.onChange(async (value) => {
					this.plugin.settings.targetFolder = value;
					await this.plugin.saveSettings();
				}));

		let extensionRecords = this.plugin.settings.handledFileExtension

		containerEl.createEl('h2', { text: 'The plugin is activated for the following extension' });

		for (const key in extensionRecords) {
			const value = extensionRecords[key];
			new Setting(containerEl)
				.setName(key)
				.addToggle(cb => cb
					.setValue(value)
					.onChange(async (newValue) => {
						this.plugin.settings.handledFileExtension[key] = newValue;
						await this.plugin.saveSettings();
					}));
		}
	}
}
