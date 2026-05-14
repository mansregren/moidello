"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { UserCard } from "../user/UserCard";
import { users } from "@/lib/data";

export function TopCreators() {
  return (
    <section className="py-16 md:py-24 bg-background-secondary">
      <Container>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground text-center mb-16"
        >
          Top <span className="text-foreground-subtle">Kreatörer</span>
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-12 md:gap-16">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <UserCard user={user} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
