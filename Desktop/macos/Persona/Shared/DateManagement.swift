import Foundation
import FirebaseFirestore


func timestampToDateString(timestamp: FirebaseFirestore.Timestamp) -> String {
    let today = FirebaseFirestore.Timestamp.init()
    let secondsPast = Double(today.seconds - timestamp.seconds)
    let secondsInMin = 60.0;
    let secondsInHour = 3600.0;
    let secondsInDay = 86400.0;
    let secondsInWeek = 604800.0;
    let secondsInYear = 31540000.0;
    if (secondsPast < secondsInHour) {
        return String(Int(secondsPast / secondsInMin)) + "m"
    } else if (secondsPast < secondsInDay) {
        return String(Int(secondsPast / secondsInHour)) + "h"
    } else if (secondsPast < secondsInWeek) {
        return String(Int(secondsPast / secondsInDay)) + "d"
    } else if (secondsPast < secondsInYear) {
        return String(Int(secondsPast / secondsInWeek)) + "w"
    } else {
        return String(Int(secondsPast / secondsInYear)) + "y"
    }
}
