# Putting your library online

A site shows your library to anyone who has its address: the samples from your module collection,
the cloud, and morphs between samples. It never shows where your files are on your computer, and it
never shows your labels, ratings or favorites. Samples that exist only in sample folders you keep
private, such as a commercial pack, stay on your computer.

This guide puts a site on [Railway](https://railway.com). The catalog of a large collection takes up
several gigabytes, so you need Railway's Pro plan.

## What you need

- **A copy of this repository**, set up as [Running from source](source.md#setup) describes. You
  run every command in this guide from its folder.
- **Your library, built** in the SampleRipper app or from the copy of the repository.
- **The Railway command-line tool**, signed in, and recent enough that `railway connect --help`
  lists `--tunnel-only`: `npm install --global @railway/cli`, then `railway login`.

## Set up the site once

1. **Create a project** in Railway, and add a **PostgreSQL** database to it. Then run `railway link`
   in the repository's folder and choose the project, so the `railway` commands in this guide reach
   it.
2. **Add the site.** Add a new service to the project from this repository on GitHub. Railway reads
   `railway.json` and builds the `Dockerfile`.
3. **Give the site a volume** mounted at `/library`. The site's audio lives there.
4. **Create the reader's password.** The site reads your catalog as a database user that can't
   change anything, and that user's password must be generated rather than made up:

   ```sh
   uv run python -c "from samplecore.passwords import new_password; print(new_password())"
   ```

   Save it in your password manager. You need it every time you publish.
5. **Tell the site where the catalog is.** In the site service's Variables tab, add
   `SAMPLERIPPER_SERVER_DATABASE_URL` with this value, putting your password in place of
   `<the password>`:

   ```
   postgresql+psycopg://sampleripper_reader:<the password>@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.PGDATABASE}}
   ```

   - `sampleripper_reader` is the database user the site connects as. Publishing creates it.
   - `Postgres` is the name of your database service as the project canvas shows it. If yours is
     named differently, use its name in both places.
   - Under the field, Railway shows the value with those parts filled in. Check that it shows a
     host and a database name before you save.
   - Once it's saved, seal the variable so Railway never shows it again.
   - Add no other database variable. The site refuses to start with any connection that could
     change the catalog.
6. **Set a spending limit** in the project's usage settings. A flood of visitors then costs no more
   than the limit you chose.
7. **Give the site an address** in its Settings tab, under Networking.

The site keeps restarting until you publish for the first time, because the database user it
connects as doesn't exist yet. After that it starts, and its log says it has no audio until you
upload it.

## Publish

Publishing copies your catalog to the site's database, and gathers the site's audio into a folder
of your library named `publication`. Publish again whenever you want the site to match your library.

**Which library you publish.** A library you built from the repository is described by the
repository's `config.toml`, and `uv run sampleripper publish` reads it. A library you built in the
SampleRipper app is described by the app's own config file:

| System | The app's config file |
|---|---|
| Linux | `~/.config/SampleRipper/config.toml` |
| macOS | `~/Library/Application Support/SampleRipper/config.toml` |
| Windows | `%LOCALAPPDATA%\SampleRipper\config.toml` |

To publish the app's library, keep the app open, since it runs the library's database, and name its
config file in the command: `uv run sampleripper --config ~/.config/SampleRipper/config.toml publish`.

1. **Choose the sample folders the site shows,** if any, in that config file:

   ```toml
   [publish]
   sample_directories = ["/home/you/Samples/Free Pack"]
   ```

   Your module collection is always published. A sample folder is published only when you name it
   here. The page links that `sampleripper links import` recorded are published with the modules.
2. **Open a tunnel to the database.** In a second terminal, in the repository's folder, run this
   and leave it running:

   ```sh
   railway connect Postgres --tunnel-only --port 6543
   ```

   It connects port `6543` on your computer to the database through your Railway login, and prints
   the database's address on your computer:

   ```
   postgresql://postgres:<password>@127.0.0.1:6543/railway
   ```

   It signs in as Railway's own database user, which may create the site's tables and its reader.
   The database stays closed to the internet the whole time: your computer reaches it through the
   tunnel, which closes when you stop it. Use your database service's name in place of `Postgres`, and any free
   port in place of `6543`.
3. **Publish** from your first terminal. These commands read the two secrets without showing them
   or saving them in your shell's history. Paste the address the tunnel printed at the first prompt,
   and the reader's password at the second:

   ```sh
   read -rs SAMPLERIPPER_PUBLISH_DATABASE_URL && export SAMPLERIPPER_PUBLISH_DATABASE_URL
   read -rs SAMPLERIPPER_PUBLISH_READER_PASSWORD && export SAMPLERIPPER_PUBLISH_READER_PASSWORD
   uv run sampleripper publish
   ```

   For the app's library, add `--config` and the app's config file to the last command, as shown
   above.

   The reader's password must be the one in the site's `SAMPLERIPPER_SERVER_DATABASE_URL`.
   Publishing sets the reader's password, so a different one locks the running site out.

   The tunnel encrypts everything between your computer and Railway, and only someone with access
   to your Railway project can open one. Publishing never copies your labels, ratings or favorites.
   If anything it would copy names one of your folders, it stops and changes nothing.
4. **Close the tunnel** with Ctrl+C in its terminal.
5. **Redeploy the site** from its Deployments tab, so it reads the new catalog.
6. **Upload the audio** to the site's volume. Publishing ends by naming the folder and how many
   files it holds. Railway names a volume's files from the volume's own root, which the site sees as
   `/library`:

   ```sh
   railway volume files upload <your library>/publication/objects /objects
   ```

   The upload goes through the running site, and each sample plays as soon as its file arrives. If
   your samples haven't changed since you last published, the volume already holds them all and
   you can skip this step. Files of samples you no longer publish stay on the volume, and the site
   never plays them. To clear them out, run `railway volume files delete /objects` before you
   upload, knowing the samples stay silent until the upload finishes.

**Reading the address with the Railway tool.** You can also build the address from Railway's own
record of the database, so it stays off your screen:

```sh
export SAMPLERIPPER_PUBLISH_DATABASE_URL="$(railway variable list --service Postgres --kv | sed -n 's/^DATABASE_URL=//p' | sed -E 's#@[^@/]+/([^/]*)$#@127.0.0.1:6543/\1#')"
printf '%s\n' "$SAMPLERIPPER_PUBLISH_DATABASE_URL" | sed -E 's#//[^@]*@#//***@#'
```

The first line takes the database's private address and puts the tunnel's end, `127.0.0.1:6543`,
in place of its host and port. The second prints the result with its user and password hidden, and
should show `postgresql://***@127.0.0.1:6543/railway`. Use your database service's name in place
of `Postgres`, and the tunnel's port in place of `6543`. Then run only the last two lines of step 3.

## Updating the site

Railway builds the site again whenever its code changes on the branch the site follows. A new
version may read tables that the site's database doesn't have yet, and a site missing a table
refuses to start. So publish first, then update:

1. **Publish with the new version**, from a copy of the repository that has it. Skip the redeploy in
   step 5, since the update restarts the site anyway. The site that's running keeps working, because it ignores
   tables it doesn't know.
2. **Push or merge the new version** to the branch the site follows. The running site keeps serving
   while Railway builds.
3. **Expect a short pause.** When the build is ready, Railway stops the running site before it
   starts the new one, since only one of them can use the volume at a time. Railway's health check
   can't bridge that gap.
4. **Roll back if the new site doesn't start.** Pick the previous deployment in the Deployments tab
   and roll back to it, then read the failed deployment's log.

## Check it once it runs

1. **Open `/api/health`** at the site's address. `audio_present` is `true` once the audio has
   arrived. Then play a few samples and a morph.

   If the site refuses to start and names its audio store, it can't read its volume. Add the
   variable `RAILWAY_RUN_UID=0` to the site's service, and the site runs as the volume's owner.
2. **Check that each visitor gets limits of their own.** This command asks for the whole-catalog
   summary 30 times, each time pretending to be a different visitor:

   ```sh
   for i in $(seq 30); do curl -s -o /dev/null -w "%{http_code} " -H "X-Real-IP: 203.0.113.$i" https://<your site>/api/stats; done; echo
   ```

   Some of the last answers should be `429`. If every answer is `200`, the site trusts the made-up
   addresses, and one visitor could ask for as much as they like. Stop the site, and keep it
   stopped until this check passes.
3. **Check that the database is closed to the internet:** the TCP Proxy is off, under Networking in
   the PostgreSQL service's Settings tab.

## Let the site sleep while nobody visits

Railway charges for the memory the site holds while it runs. It can stop the site after a few
minutes without visitors and start it again when someone arrives, so you pay only while the site is
in use.

1. **Turn on sleeping.** In the site service's Settings tab, turn on **Serverless**. If the site
   keeps running after that, redeploy it once from its Deployments tab.
2. **Wait about ten minutes** without opening the site. The project canvas then shows the site as
   sleeping.
3. **Check how long a visitor waits** while it wakes:

   ```sh
   curl -o /dev/null -s -w '%{http_code} %{time_total}\n' https://<your site>/api/health
   ```

   It should print `200` and a time under 10 seconds. If it takes longer, or prints `502`, turn
   Serverless off again.

When the site wakes, the visitor who woke it waits while it starts: the site answers once its
morph renderer is ready and its cloud is loaded, so everything works from the first page on.

If the site never goes to sleep, something keeps it busy: answering anyone who visits it every
few minutes, a search engine's crawler included, keeps it awake. Its Metrics tab shows whether
requests keep arriving.

## Try it on this computer first

`docker compose` runs the same site with a database of its own, so you can see what visitors will
see before anything goes online. See [Running from source](source.md#docker).

## What the site keeps closed

- It reads the catalog as a database user that Postgres doesn't allow to change anything, and it
  starts only as that user.
- It shows no labels, ratings or favorites, and no paths on your computer.
- Each visitor can ask for only so much, and morphs have limits of their own.
- Its morph renderer takes requests from the site only.

[How it works](architecture.md#deployment) explains all of this in detail.
