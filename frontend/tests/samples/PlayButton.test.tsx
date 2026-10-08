import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { M } from "../../src/messages/messageIds";
import { PlayButton } from "../../src/samples/PlayButton";
import { Icon } from "../../src/shared/icons/Icon";

describe("PlayButton", () => {
    it("renders its children inside a clickable button that plays the sample's audio", () => {
        render(
            <PlayButton playbackRateHz={null} sampleHash="sample-play-button">
                <Icon name="play" label={null} />
            </PlayButton>,
        );

        const button = screen.getByRole("button", { name: M.samples.preview.play });
        expect(button.querySelector(".icon")).toBeInTheDocument();

        fireEvent.click(button);

        expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("is not pressed for a sample other than the one currently playing", () => {
        render(
            <PlayButton playbackRateHz={null} sampleHash="sample-not-playing">
                <Icon name="play" label={null} />
            </PlayButton>,
        );

        expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
});
