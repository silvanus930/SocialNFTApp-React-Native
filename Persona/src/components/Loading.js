import {ActivityIndicator, Text, View, StyleSheet} from 'react-native';
import baseText from 'resources/text';
import colors from 'resources/colors';
import React from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const quotes = [
    {
        text: 'The wound is the place where the light enters you.',
        author: 'Rumy',
    },
    {
        text: 'Fish are friends, not food!',
        author: 'Dory',
    },
    {
        text: 'Just keep swimming, just keep swimming...',
        author: 'Dory',
    },
    {
        text: 'Who sees all beings in his own Self, and his own Self in all beings, loses all fear... When a sage sees this great Unity and his Self has become all beings, what delusion and what sorrow can ever be near him?',
        author: 'Upanishads',
    },
    {
        text: 'Given the choice between the experience of pain and nothing, I would choose pain',
        author: 'William Faulkner',
    },
    {
        text: 'To live anywhere in the world today and be against equality because of race or color, is like living in Alaska and being against snow',
        author: 'William Faulkner',
    },
    {
        text: 'A writer is congenitally unable to tell the truth and that is why we call what he writes fiction.',
        author: 'William Faulkner',
    },
    {
        text: "The artist is of no importance. Only what he creates is important, since there is nothing new to be said. Shakespeare, Balzac, Homer have all written about the same things, and if they had lived one thousand or two thousand years longer, the publishers wouldn't have needed anyone since.",
        author: 'William Faulkner',
    },
    {
        text: "In my time I have seen truth that was anything under the sun but just, and I have seen justice using tools and instruments I wouldn't want to touch with a 10-foot fence rail.",
        author: 'William Faulkner',
    },
    {
        text: 'My own experience has been that the tools I need for my trade are paper, tobacco, food, and a little whisky.',
        author: 'William Faulkner',
    },
    {
        text: 'I feel like a wet seed wild in the hot blind earth.',
        author: 'William Faulkner',
    },
    {
        text: "Don't bother just to be better than your contemporaries or predecessors. Try to be better than yourself.",
        author: 'William Faulkner',
    },

    {
        text: 'We have to start teaching ourselves not to be afraid',
        author: 'William Faulkner',
    },
    {
        text: "Dying is an art, like everything else. I do it exceptionally well. I do it so it feels like hell. I do it so it feels real. I guess you could say I've a call.",
        author: 'Sylvia Plath',
    },
    {
        text: 'The blood jet is poetry and there is no stopping it.',
        author: 'Sylvia Plath',
    },
    {
        text: 'Is there no way out of the mind?',
        author: 'Sylvia Plath',
    },
    {
        text: 'If you expect nothing from anybody, you’re never disappointed.',
        author: 'Sylvia Plath',
    },
    {
        text: 'I took a deep breath and listened to the old bray of my heart. I am. I am. I am.',
        author: 'Sylvia Plath',
    },
    {
        text: 'I have the choice of being constantly active and happy or introspectively passive and sad. Or I can go mad by ricocheting in between.',
        author: 'Sylvia Plath',
    },
    {
        text: "The silence depressed me. It wasn't the silence of silence. It was my own silence.",
        author: 'Sylvia Plath',
    },
    {
        text: "If neurotic is wanting two mutually exclusive things at one and the same time, then I'm neurotic as hell. I'll be flying back and forth between one mutually exclusive thing and another for the rest of my days.",
        author: 'Sylvia Plath',
    },
    {
        text: 'Time exists in order that everything doesn’t happen all at once...\nand space exists so that it doesn’t all happen to you.',
        author: 'Susan Sontag',
    },
    {
        text: "It hurts to love. It's like giving yourself to be flayed and knowing that at any moment the other person may just walk off with your skin.",
        author: 'Susan Sontag',
    },
    {
        text: 'Never worry about being obsessive. I like obsessive people. Obsessive people make great art',
        author: 'Susan Sontag',
    },
    {
        text: 'The only interesting answers are those which destroy the questions.',
        author: 'Susan Sontag',
    },
    {
        text: 'My library is an archive of longings.',
        author: 'Susan Sontag',
    },
    {
        text: "I haven't been everywhere, but it's on my list.",
        author: 'Susan Sontag',
    },
    {
        text: "Do stuff. be clenched, curious. Not waiting for inspiration's shove or society's kiss on your forehead. Pay attention. It's all about paying attention. attention is vitality. It connects you with others. It makes you eager. stay eager.",
        author: 'Susan Sontag',
    },
    {
        text: 'Attention is vitality. It connects you with others. It makes you eager. Stay eager.',
        author: 'Susan Sontag',
    },
    {
        text: 'All photographs are memento mori. To take a photograph is to participate in another person’s (or thing’s) mortality, vulnerability, mutability. Precisely by slicing out this moment and freezing it, all photographs testify to time’s relentless melt.',
        author: 'Susan Sontag',
    },
    {
        text: 'To paraphrase several sages: Nobody can think and hit someone at the same time.',
        author: 'Susan Sontag',
    },
    {
        text: 'Formerly, when I didn’t know that they read my tales and passed judgement on them, I wrote serenely, just the way I eat blini; now, I’m afraid when I write.',
        author: 'Антон Павлович Чехов (Anton Chekhov)',
    },
    {
        text: 'A prose that is altogether alive demands something of the reader that the ordinary novel-reader is not prepared to give.',
        author: 'T. S. Eliot',
    },
    {
        text: 'Nothing can come about without loneliness. I have created a loneliness for myself which no-one can imagine.',
        author: 'Pablo Picasso',
    },
    {
        text: 'People struggle for what they believe to be their values, but what may be merely emotions momentarily aroused.',
        author: 'Jose Saramago',
    },
    {
        text: 'In me, by myself, without human relationship, there are no visible lies. The limited circle is pure.',
        author: 'Franz Kafka',
    },
    {
        text: 'Misery creates an aesthetic in which the exception, the irregular beauty, is the true rule.',
        author: 'Octavio Paz',
    },
    {
        text: 'Once I ceased to see the world as very mysterious, I would no longer wish to write.',
        author: 'Anthony Burgess',
    },
    {
        text: 'Against engaged literature. Man is not ONLY a social being. At least his death belongs to him. We are made to live for others. But one really dies only for oneself.',
        author: 'Albert Camus',
    },
    {
        text: 'To correct a natural indifference, I was placed halfway between misery and the sun. Misery prevented me from feeling that all is well under the sun and in history; the sun taught me that history is not everything.',
        author: 'Albert Camus',
    },
    {
        text: "You enter a completely new world where things aren't at all what you're used to.",
        author: 'Edward Witten',
    },
    {
        text: 'String theory is an attempt at a deeper description of nature by thinking of an elementary particle not as a little point but as a little loop of vibrating string',
        author: 'Edward Witten',
    },
    {
        text: "We know a lot of things, but what we don't know is a lot more.",
        author: 'Edward Witten',
    },
    {
        text: 'When you ask what are electrons and protons I ought to answer that this question is not a profitable one to ask and does not really have a meaning. The important thing about electrons and protons is not what they are but how they behave, how they move. I can describe the situation by comparing it to the game of chess. In chess, we have various chessmen, kings, knights, pawns and so on. If you ask what chessman is, the answer would be that it is a piece of wood, or a piece of ivory, or perhaps just a sign written on paper, or anything whatever. It does not matter. Each chessman has a characteristic way of moving and this is all that matters about it. The whole game of chess follows from this way of moving the various chessmen.',
        author: 'Paul Dirac',
    },
    {
        text: 'have tried to read philosophers of all ages and have found many illuminating ideas but no steady progress toward deeper knowledge and understanding. Science, however, gives me the feeling of steady progress: I am convinced that theoretical physics is actual philosophy. It has revolutionized fundamental concepts, e.g., about space and time (relativity), about causality (quantum theory), and about substance and matter (atomistics), and it has taught us new methods of thinking (complementarity) which are applicable far beyond physics.',
        author: 'Max Born',
    },
    {
        text: '...I am not, however, militant in my atheism. The great English theoretical physicist Paul Dirac is a militant atheist. I suppose he is interested in arguing about the existence of God. I am not. It was once quipped that there is no God and Dirac is his prophet.',
        author: 'Linus Pauling',
    },
    {
        text: "Many scientists have tried to make determinism and complementarity the basis of conclusions that seem to me weak and dangerous; for instance, they have used Heisenberg's uncertainty principle to bolster up human free will, though his principle, which applies exclusively to the behavior of electrons and is the direct result of microphysical measurement techniques, has nothing to do with human freedom of choice. It is far safer and wiser that the physicist remain on the solid ground of theoretical physics itself and eschew the shifting sands of philosophic extrapolations.",
        author: 'Louis de Broglie',
    },
    {
        text: "But the beauty of Einstein's equations, for example, is just as real to anyone who's experienced it as the beauty of music. We've learned in the 20th century that the equations that work have inner harmony.",
        author: 'Edward Witten',
    },
    {
        text: 'Good judgment comes from experience, and experience comes from bad judgment.',
        author: 'Rita Mae Brown',
    },
    {
        text: 'Anyone who has never made a mistake has never tried anything new.',
        author: 'Albert Einstein',
    },
    {
        text: "Nowadays most people die of a sort of creeping common sense, and discover when it is too late that the only things one never regrets are one's mistakes.",
        author: 'Oscar Wilde',
    },
    {
        text: 'An expert is a person who avoids the small errors while sweeping on to the grand fallacy.',
        author: 'Steven Weinberg',
    },
    {
        author: 'Samuel Beckett',
        text: 'Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.',
    },
    {
        text: 'A good reader, a major reader, an active and creative reader is a rereader.',
        author: 'Владимир Владимирович Набоков (Vladimir Nabokov)',
    },
    {
        text: "a story is an operation carried out on the length of time involved, an enchantment that acts on the passing of time, either contracting or dilating it. Sicilian storytellers use the formula lu cuntu nun metti tempu (time takes no time in a story) when they want to leave out links or indicate gaps of months or even years. The technique of oral narration in the popular tradition follows functional criteria. It leaves out unnecessary details but stresses repetition: for example, when the tale consists of a series of the same obstacles to be overcome by different people. A child's pleasure in listening to stories lies partly in waiting for things he expects to be repeated: situations, phrases, formulas. Just as in poems and songs the rhymes help to create the rhythm, so in prose narrative there are events that rhyme.",
        author: 'Italo Calvino',
    },
    {
        text: "It is indeed getting more and more difficult, even pointless, for me to write in formal English. And more and more my language appears to me like a veil which one has to tear apart in order to get to those things (or the nothingness) lying behind it. Grammar and style! To me they seem to have become as irrelevant as a Biedermeier bathing suit or the imperturbability of a gentleman. A mask. It is to be hoped the time will come, thank God, in certain circles it already has, when language is best used where it is most efficiently abused. Since we cannot dismiss it all at once, at least we do not want to leave anything undone that may contribute to its disrepute. To drill one hole after another into it until that which lurks behind it, be it something or nothing, starts seeping through - I cannot imagine a higher goal for today's writer.",
        author: 'Samuel Beckett',
    },
];

export default function Loading({
    backgroundColor = colors.homeBackground,
    quote = true,
    indicator = true,
}) {
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    const [index, _] = React.useState(getRandomInt(quotes.length));

    React.useEffect(() => {
        return () => {
            /*console.log(
        `writing lastQuoteIndex ${index} to local storage for user ${
          auth && auth().currentUser?.uid
        }`,
      ); // TODO actually write to local storage
      */
        };
    }, []);

    return (
        <View style={{...Style.loadingContainer, backgroundColor}}>
            <View style={Style.centerRow}>
                <View style={{alignSelf: 'center'}}>
                    {indicator && (
                        <View style={Style.loadingIndicator}>
                            <ActivityIndicator
                                size="large"
                                color={colors.textFaded}
                            />
                        </View>
                    )}
                    {/*quote && (
            <Text style={Style.loadingText}>
              <Text style={{...baseText}}>{quotes[index].text}</Text>
              {'\n\n     ― ' + quotes[index].author}
            </Text>
          )*/}
                </View>
            </View>
        </View>
    );
}

const Style = StyleSheet.create({
    loadingIndicator: {
        marginTop: 30,
        marginBottom: 40,
    },
    loadingText: {
        ...baseText,
        fontSize: 22,
        color: colors.textFaded,
        marginStart: 40,
        marginEnd: 40,
        marginTop: 60,
    },
    centerRow: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
    },
    loadingContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flex: 1,
    },
});
