import { type ReactElement, useEffect, useState } from "react";

import { type FolderListing, getFolder, getPlaces, type Place } from "../api/setup";
import type { Message } from "../messages/messageIds";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { failureOf } from "../shared/failure";
import { BottomSheet } from "../shared/overlay/BottomSheet";
import { FolderPath } from "./FolderPath";
import { SetupMessage, type SetupMessageText } from "./SetupMessage";

interface FolderPickerProps {
    readonly title: string;
    /** The folder the picker opens on; the person's first place when there is none yet. */
    readonly initialPath: string | null;
    readonly onChoose: (path: string) => void;
    readonly onClose: () => void;
}

const UP_GLYPH = "↑";
const FOLDER_GLYPH = "📁";

type ListingState =
    | { readonly status: "loading" }
    | { readonly status: "error"; readonly message: Message }
    | { readonly status: "ready"; readonly listing: FolderListing };

function describeListing(listing: ListingState): SetupMessageText {
    switch (listing.status) {
        case "loading":
            return { content: { id: M.shared.loading }, tone: "normal" };
        case "error":
            return { content: listing.message, tone: "error" };
        case "ready":
            return { content: describeContents(listing.listing), tone: "normal" };
    }
}

function describeContents(listing: FolderListing): Message {
    const values = { modules: listing.module_files, audio: listing.audio_files };
    if (listing.module_files > 0 && listing.audio_files > 0) {
        return { id: M.setup.picker.foundBoth, values };
    }
    if (listing.module_files > 0) {
        return { id: M.setup.picker.foundModules, values };
    }
    return listing.audio_files > 0 ? { id: M.setup.picker.foundAudio, values } : { id: M.setup.picker.foundNothing };
}

/**
 * A folder browser the local application serves, since a web page reads no folder names of its own:
 * the person's usual places and drives, the folders inside the one open, and how many modules and
 * audio files it holds, so a collection is recognized before it is chosen. The list keeps one
 * height and the buttons one place while folders load.
 */
export function FolderPicker({ title, initialPath, onChoose, onClose }: FolderPickerProps): ReactElement {
    const { text } = useMessages();
    const [places, setPlaces] = useState<readonly Place[]>([]);
    const [path, setPath] = useState<string | null>(initialPath);
    const [listing, setListing] = useState<ListingState>({ status: "loading" });

    useEffect(() => {
        let active = true;
        getPlaces()
            .then((found) => {
                if (!active) {
                    return;
                }
                setPlaces(found);
                setPath((current) => current ?? found[0]?.path ?? null);
            })
            .catch((error: unknown) => {
                if (active) {
                    setListing({ status: "error", message: failureOf(error) });
                }
            });
        return (): void => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (path === null) {
            return undefined;
        }
        let active = true;
        setListing({ status: "loading" });
        getFolder(path)
            .then((found) => {
                if (active) {
                    setListing({ status: "ready", listing: found });
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    setListing({ status: "error", message: failureOf(error) });
                }
            });
        return (): void => {
            active = false;
        };
    }, [path]);

    const ready = listing.status === "ready" ? listing.listing : null;
    const parent = ready?.parent ?? null;

    return (
        <BottomSheet title={title} onClose={onClose}>
            <nav className="folder-places" aria-label={text(M.setup.picker.places)}>
                {places.map((place) => (
                    <Button
                        key={place.path}
                        variant="quiet"
                        aria-pressed={place.path === path}
                        onClick={() => {
                            setPath(place.path);
                        }}
                    >
                        {place.name}
                    </Button>
                ))}
            </nav>
            <div className="folder-current">
                <Button
                    variant="secondary"
                    icon
                    aria-label={text(M.setup.picker.up)}
                    disabled={parent === null}
                    onClick={() => {
                        if (parent !== null) {
                            setPath(parent);
                        }
                    }}
                >
                    {UP_GLYPH}
                </Button>
                <div className="field field-static">
                    <FolderPath path={ready?.path ?? path} placeholder="" />
                </div>
            </div>
            <SetupMessage message={describeListing(listing)} />
            <ul className="listbox is-interactive folder-list">
                {ready?.folders.map((folder) => (
                    <li key={folder.path} className="listbox-row">
                        <Button
                            variant="quiet"
                            wide
                            className="folder-entry"
                            onClick={() => {
                                setPath(folder.path);
                            }}
                        >
                            <span aria-hidden>{FOLDER_GLYPH}</span> {folder.name}
                        </Button>
                    </li>
                ))}
                {ready?.folders.length === 0 && (
                    <li className="listbox-row listbox-empty">{text(M.setup.picker.noSubfolders)}</li>
                )}
            </ul>
            <div className="sheet-buttons">
                <Button variant="secondary" onClick={onClose}>
                    {text(M.shared.cancel)}
                </Button>
                <Button
                    variant="primary"
                    disabled={ready === null}
                    onClick={() => {
                        if (ready !== null) {
                            onChoose(ready.path);
                        }
                    }}
                >
                    {text(M.setup.picker.choose)}
                </Button>
            </div>
        </BottomSheet>
    );
}
