const moment = require('moment');

async function getfinalopenstatus(store) {
  let finalopenstatus = "Closed";
  if (store) {

    // FORCE OPEN
    if (
      store.openCloseStatus ===
      "ForceOpen"
    ) {

      finalopenstatus = "Open";

    }

    // FORCE CLOSE
    else if (
      store.openCloseStatus ===
      "ForceClose"
    ) {

      finalopenstatus = "Closed";

    }

    // AUTO
    else {

      const today =
        moment().format("dddd");

      // NOT WEEK OFF
      if (
        !store.weekOff?.includes(today)
      ) {

        // TIME EXISTS
        if (
          store.openingTime &&
          store.closingTime
        ) {

          const now =
            moment();

          const openTime =
            moment(
              store.openingTime,
              "HH:mm"
            );

          const closeTime =
            moment(
              store.closingTime,
              "HH:mm"
            );

          if (
            now.isBetween(
              openTime,
              closeTime
            )
          ) {

            finalopenstatus = "Open";

          }

        }

      }

    }

     

  }

  return finalopenstatus;
}

module.exports = { getfinalopenstatus };