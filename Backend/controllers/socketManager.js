const gotMessageFromServer = async (
  fromId,
  message
) => {
  try {
    console.log(
      "SIGNAL RECEIVED FROM:",
      fromId
    );

    const signal = JSON.parse(message);

    const peer = connections.current[fromId];

    if (!peer) {
      console.log(
        "Peer not found:",
        fromId
      );
      return;
    }

    // =====================================
    // SDP
    // =====================================

    if (signal.sdp) {
      console.log(
        "RECEIVED SDP:",
        signal.sdp.type
      );

      await peer.setRemoteDescription(
        new RTCSessionDescription(
          signal.sdp
        )
      );

      console.log(
        "REMOTE DESCRIPTION SET:",
        fromId
      );

      // ===================================
      // ADD QUEUED ICE CANDIDATES
      // ===================================

      if (
        iceCandidatesQueue.current[fromId]
      ) {
        for (
          const candidate of
          iceCandidatesQueue.current[
          fromId
          ]
        ) {
          try {
            await peer.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );
          } catch (error) {
            console.error(
              "Queued ICE error:",
              error
            );
          }
        }

        delete iceCandidatesQueue.current[
          fromId
        ];
      }

      // ===================================
      // OFFER -> ANSWER
      // ===================================

      if (
        signal.sdp.type === "offer"
      ) {
        console.log(
          "Creating ANSWER for:",
          fromId
        );

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "Sending ANSWER to:",
          fromId
        );

        socketRef.current.emit(
          "signal",
          fromId,
          JSON.stringify({
            sdp: peer.localDescription,
          })
        );
      }
    }

    // =====================================
    // ICE CANDIDATE
    // =====================================

    if (signal.ice) {
      console.log(
        "RECEIVED ICE FROM:",
        fromId
      );

      // Remote description not ready yet
      if (!peer.remoteDescription) {
        console.log(
          "Queueing ICE candidate:",
          fromId
        );

        if (
          !iceCandidatesQueue.current[
          fromId
          ]
        ) {
          iceCandidatesQueue.current[
            fromId
          ] = [];
        }

        iceCandidatesQueue.current[
          fromId
        ].push(signal.ice);

        return;
      }

      // Remote description ready
      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(
            signal.ice
          )
        );

        console.log(
          "ICE ADDED:",
          fromId
        );
      } catch (error) {
        console.error(
          "ICE error:",
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "SIGNAL ERROR:",
      error
    );
  }
};