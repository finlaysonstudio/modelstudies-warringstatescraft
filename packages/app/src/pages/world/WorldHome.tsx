import { Link } from "react-router-dom";
import { CAMPAIGNS } from "../../campaigns";

// The World front page: the country the chronicle is set in, as a reader
// walks it. The overworld first, then the three settlements at their smaller
// scales, then the art all four are drawn from. Nothing here reaches a model.
export function WorldHome() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Exhibit
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {CAMPAIGNS.world.title}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          {CAMPAIGNS.world.blurb}
        </p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <section
          id="map"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Map"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Map
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The whole overworld of the chronicle on one pannable, zoomable
            stage: every court, pass, ford, and work a chapter names, with a
            control panel that choreographs any move from the stage's closed
            vocabulary — an envoy court to court, a column to the pass, a fleet
            along the coast.
          </p>
          <Link
            to="/world/map"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            open the map →
          </Link>
        </section>

        <section
          id="city"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="City"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            City
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            A model capital of the period on the same stage: the Zhongshan
            capital's twin-city plan under the Kaogongji's rule, its palace
            terraces, temple, altar, market well, kilns, and wards each with a
            note from the statutes and the site reports, walked by the townsfolk
            the registers counted.
          </p>
          <Link
            to="/world/city"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            walk the city →
          </Link>
        </section>

        <section
          id="village"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Village"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Village
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            A ward at ten metres a tile: twenty-five farmsteads in five groups
            of five along three gated lanes, with the ward hall, two wells, a
            granary, a threshing floor, a byre, and the silk shed, the altar of
            the soil god on the rise and the graves beyond it, the fields in
            blocks under every crop the sources harvest, a brook with its ford
            and its pond, and the post station on the road out, walked by a
            hundred and one villagers through every month of a household
            register.
          </p>
          <Link
            to="/world/village"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            walk the village →
          </Link>
        </section>

        <section
          id="house"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="House"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            House
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The compound of a great officer inside a capital, at a scale where a
            hall is four tiles wide: the gate and its screen, the forecourt of
            shed, stable, kitchen, and granary, the hall on its terrace between
            two ranges, and the inner wall closing the chambers, the garden, and
            the pond, walked by the family, its retainers, and its servants.
          </p>
          <Link
            to="/world/house"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            walk the house →
          </Link>
        </section>

        <section
          id="tiles"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Tiles"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Tiles
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The art the overworld is drawn from, generated for this project one
            prompt at a time: every biome autotiled on the patch that shows its
            transitions, every marker and figure on the ground it stands on, and
            beside each one the prompt it came from and what the build did to
            the reply.
          </p>
          <Link
            to="/world/tiles"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            see the tiles →
          </Link>
        </section>
      </div>
    </div>
  );
}
