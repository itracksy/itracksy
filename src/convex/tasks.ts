import { query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const user = await ctx.auth.getUserIdentity();

        if (user === null) {
            return null;
        }

        console.log("user", user.tokenIdentifier);
        return await ctx.db.query("tasks").collect();
    },
});
