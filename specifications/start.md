# Keranemie

Keranemie is a mobile-first web app to organize challenges (a scavenger hunt) for a group during an event. Players join a party, are split into teams, and complete challenges to earn points. The admins follow everything live and validate submissions.

## Roles

- **Admin**: creates and runs a party. Has an account (email sign-in). A party can have several admins.
- **Player**: joins a party with a code. No account needed; the session is kept on the device so the player can come back.

## Party lifecycle

1. **Draft**: the admins configure the party. Players can't join yet.
2. **Open**: players can join and see their team, but challenges are hidden until the start time.
3. **Live**: between start and end time. Players submit challenges.
4. **Ended**: no more submissions. Final leaderboard and gallery stay visible.

An admin can open, start or end the party manually, overriding the scheduled times.

## Admin

### Party

An admin can create a party for their event. A party has:
- Name
- Description (optional, shown to players on join)
- Start and end time
- Join code (generated, 6 characters) and QR code / join link

The admin gets the code and the QR code to share access to the party (displayable full screen for projection).

### Admins

The creator of a party can invite other admins by email. All admins have the same rights on the party, except that only the creator can remove admins or delete the party.

### Teams

The admin configures the teams:
- Name
- Color (or emoji) for quick recognition

When joining, a player is automatically put in the team with the fewest players (ties broken randomly).

An admin can move a player to another team at any time. The player's points move with them.

### Challenges

The admin configures the challenges. Each challenge has:
- Title
- Description / instructions
- Type (see [Types](#types))
- Points
- Validation: **automatic** (points granted immediately) or **manual** (an admin approves first)

Availability:
- **Permanent challenges**: available for the whole duration of the party
- **Flash challenges**: available for a limited time. Has a start time and a duration. Players are notified when it starts. It can also be triggered manually from the dashboard ("launch now").

Challenges can be reordered, edited, and hidden while the party is live. Editing the points of a challenge does not change already approved submissions.

### Live dashboard

The admin sees a live dashboard with:
- Leaderboard (teams, and players)
- Activity feed of all submissions
- Review queue for submissions waiting for manual validation
- Upcoming and running flash challenges, with countdowns
- Players list per team

### Review

For each submission, an admin can:
- Approve it (default points)
- Reject it, with an optional message to the player. The player can submit again while the challenge is still available.
- Adjust the points (e.g. bonus for a great photo)

An admin can also grant or remove bonus points to a team or player outside of any challenge, with a reason.

### After the party

- Final leaderboard
- Gallery of all photo submissions, filterable by team / challenge

## Onboarding

Easily join a party with a code, a QR code, or a link. The player:
1. Sees the party name and description
2. Chooses a display name (unique within the party)
3. Confirms they want to join
4. Is assigned a team

If the player opens the app again on the same device, they are sent back to their party.

Players can join while the party is open or live, not once it has ended.

## Challenges

Challenges are not visible to players before the party starts.

The player sees a list of available challenges, permanent and flash ones. Flash challenges are highlighted at the top with a countdown.

To complete a challenge, the player selects it and provides the necessary data depending on the challenge type.

The player also sees the challenges they have already done, with their status (pending, approved, rejected) and the number of points given.

The player sees their score, their team's score, and the leaderboard. The leaderboard stays visible until the end.

The player sees an activity feed with the submissions of everyone in the party (photos and answers), once approved.

### Scoring

- Each player completes a challenge individually: a challenge can be completed once per player, so several players of the same team can each complete it.
- A player's score is the sum of their approved submissions and their bonus points.
- A team's score is the sum of its players' scores plus the bonus points given to the team.
- Only approved submissions count. Pending ones are shown but not counted.

### Types

- **Photo**: take a photo with the camera or pick one from the gallery, with an optional caption
- **Text**: free text answer. Optionally, the admin sets an expected answer for automatic validation (case and accent insensitive).

## Notifications

- Flash challenge starts
- Submission approved / rejected

In-app notifications (toast + badge) while the app is open. Web push notifications when the player allows it (on iOS this requires adding the app to the home screen).

## Languages

The app is available in French and English. The language follows the device language, with a switch in the app. Content written by admins (party, challenges) is not translated.

## Non-functional

- Mobile-first, works in the phone browser without install (installable as a PWA)
- Real-time updates (dashboard, leaderboard, feed)
- Photos are resized on upload
- Supports ~50 players per party
