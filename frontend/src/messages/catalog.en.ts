import { CLOUD_MESSAGES } from "./areas/cloud.en";
import { LAYOUT_MESSAGES } from "./areas/layout.en";
import { MODULES_MESSAGES } from "./areas/modules.en";
import { MORPH_MESSAGES } from "./areas/morph.en";
import { NAVIGATION_MESSAGES } from "./areas/navigation.en";
import { SAMPLES_MESSAGES } from "./areas/samples.en";
import { SETUP_MESSAGES } from "./areas/setup.en";
import { SHARED_MESSAGES } from "./areas/shared.en";
import { SHELL_MESSAGES } from "./areas/shell.en";
import { STATS_MESSAGES } from "./areas/stats.en";
import { THEME_MESSAGES } from "./areas/theme.en";
import { WORKSPACE_MESSAGES } from "./areas/workspace.en";

export const CATALOG_EN = {
    navigation: NAVIGATION_MESSAGES,
    shared: SHARED_MESSAGES,
    setup: SETUP_MESSAGES,
    samples: SAMPLES_MESSAGES,
    modules: MODULES_MESSAGES,
    stats: STATS_MESSAGES,
    cloud: CLOUD_MESSAGES,
    morph: MORPH_MESSAGES,
    shell: SHELL_MESSAGES,
    workspace: WORKSPACE_MESSAGES,
    theme: THEME_MESSAGES,
    layout: LAYOUT_MESSAGES,
} as const;
