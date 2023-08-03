const fs = require('fs');
const path = require('path');

const issuePayload = JSON.parse(process.env.ISSUE_PAYLOAD);

const labelNames = issuePayload.labels.map(label => label.name);
if (!labelNames.includes('nomination-accepted')) {
  process.exit(0); // Exit if the issue is not labeled with 'nomination-accepted'
}

const name = getNameFromIssue(issuePayload); // Extract the name from the issue
if (!name) {
  console.error('Name not found in the issue');
  process.exit(1);
}

const rookiesFilePath = path.join(__dirname, '../../../../Rookies/README.md');
const heroesFilePath = path.join(__dirname, '../../../../Heroes/README.md');

if (!fs.existsSync(rookiesFilePath)) {
    console.error('Rookies/README.md does not exist');
    process.exit(1);
  }
  
if (!fs.existsSync(heroesFilePath)) {
    console.error('Heroes/README.md does not exist');
    process.exit(1);
}

let rookies = fs.readFileSync(rookiesFilePath, 'utf-8');
let heroes = fs.readFileSync(heroesFilePath, 'utf-8');

if (!rookies.trim()) {
    console.error('Rookies/README.md is empty');
    process.exit(1);
  }
  
if (!heroes.trim()) {
console.error('Heroes/README.md is empty');
process.exit(1);
}

const rookieStartIndex = rookies.indexOf('## Rookies List') + '## Rookies List'.length;
const rookieEndIndex = rookies.indexOf('## Contributing');

rookies = rookies.slice(rookieStartIndex, rookieEndIndex).split('### ').slice(1); // Split profiles by '### '

const heroStartIndex = heroes.indexOf('## Heroes List') + '## Heroes List'.length;
const heroEndIndex = heroes.indexOf('## Contributing');

heroes = heroes.slice(heroStartIndex, heroEndIndex).split('### ').slice(1); // Split profiles by '### '

const rookieIndex = rookies.findIndex(profile => profile.startsWith(`${name}`));
if (rookieIndex === -1) {
  console.error('Profile not found in Rookies/README.md');
  process.exit(1);
}

const profile = rookies.slice(rookieIndex, 1)[0]; // Remove the profile from rookies

// Check if the hero with the same name and GitHub profile already exists
const profileGithubProfile = getAttributeFromProfile(profile, 'GitHub Profile');  // Extract GitHub Profile from the profile

const existingHero = heroes.find(hero => {
    const heroName = hero.split('\n')[0];  // Extract the first line (name) from the hero profile
    const heroGithubProfile = getAttributeFromProfile(hero, 'GitHub Profile');  // Extract GitHub Profile from the hero profile
    return heroName === name && heroGithubProfile === profileGithubProfile;
  });
  
  if (existingHero) {
    console.warn(`Hero with the same name '${name}' but a different GitHub profile already exists in Heroes/README.md`);
    process.exit(0); // Exit without adding the profile to the Heroes list
  }

// Find the correct index to insert the profile alphabetically
let heroIndex = heroes.findIndex(hero => {
  const heroName = hero.split('\n')[0];  // Extract the first line (name) from the hero profile
  const comparison = heroName.localeCompare(name);
  if (comparison > 0) {
    return true;
  } else if (comparison === 0) {
    const heroGithubProfile = getAttributeFromProfile(hero, 'GitHub Profile');  // Extract GitHub Profile from the hero profile
    return heroGithubProfile.localeCompare(profileGithubProfile) > 0;
  } else {
    return false;
  }
});

if (heroIndex === -1) heroIndex = heroes.length; // If no heroes have a name "greater" than the rookie, append at the end

heroes.slice(heroIndex, 0, profile); // Insert the profile into the heroes list at the correct index

// Write back to the README files
fs.writeFileSync(rookiesFilePath, rookies.join('### '), 'utf-8');
fs.writeFileSync(heroesFilePath, heroes.join('### '), 'utf-8');

// Function to extract the name from the issue title
function getNameFromIssue(issuePayload) {
  const match = issuePayload.title.match(/^\[Nomination\] : (.+)/);
  return match ? match[1] : null;
}

// Function to extract additional attribute from the profile
function getAttributeFromProfile(profile, attribute) {
  const match = profile.match(new RegExp(`- ${attribute}: (.+)`));
  return match ? match[1] : null;
}
