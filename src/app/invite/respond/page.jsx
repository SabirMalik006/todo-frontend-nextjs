"use client";

import { Suspense } from "react";
import InnerRespondInvitePage from "./InnerRespondInvitePage";

export default function RespondInvitePageWrapper() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <InnerRespondInvitePage />
    </Suspense>
  );
}
