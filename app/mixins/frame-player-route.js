import Ember from 'ember';

// Adapted from Lookit's participate route, Experimenter's preview route, and the exp-player route mixin ce/exp-addons/blob/develop/exp-player/addon/mixins/exp-player-route.js
export default Ember.Mixin.create({
    session: Ember.inject.service(),
    _study: null,
    _child: null,
    _response: null,
    _pastResponses: Ember.A(),
    _getStudy(params) {
        return this.get('store').findRecord('study', params.study_id);
    },
    _getChild(params) {
        if (params.child_id === this.get('sessionChildId')) { // Child id in injected session and url params must match
            return this.get('store').findRecord('child', params.child_id);
        } else {
            // TODO redirect to 1) study detail 2) forbidden or 3) not found
            window.console.log('Redirected to study detail - child id in session and child id in URL params did not match')
            this.transitionTo('page-not-found');
        }
    },
    sessionChildId: Ember.computed('session', function() {
        // Pulls child info from injected session
        const session = this.get('session');
        // TODO Modify to match injected session structure
        return session.get('isAuthenticated') ? session.get('data.child.childId'): null;
    }),

    _createStudyResponse() {
        let response = this.store.createRecord('response', {
            completed: false,
            feedback: '',
            hasReadFeedback: '',
            expData: {},
            sequence: []
        });
        response.set('study', this.get('_study'));
        response.set('child', this.get('_child'));
        return response;
    },
    model(params) {
        return Ember.RSVP.Promise.resolve()
            .then(() => {
                return this._getStudy(params);
            })
            .then((study) => {
                this.set('_study', study);
                return this._getChild(params);
            })
            .then((child) => {
                this.set('_child', child);
                return this._createStudyResponse().save();
            }).then((response) => {
                this.set('_response', response);
                return this.store.findAll('response');
                // TODO restore once I know how responses will be queried
                // return this.get('store').query('response', {
                //   filter: {
                //     childId: this.get('_child').id,
                //     studyId: this.get('_study').id
                //   }
                // })
            }).then((pastResponses) => {
                const response = this.get('_response');
                this.set('_pastResponses', pastResponses.toArray());
                if (!this.get('_pastResponses').includes(response)) {
                    this.get('_pastResponses').pushObject(response);
                }
            })
            .catch((errors) => {
                window.console.log(errors);
                // TODO transition to Not Found in Django app?
                this.transitionTo('page-not-found');
            });
    },
    setupController(controller) {
        this._super(controller); // TODO Why are pastSessions passed into controller?
        controller.set('study', this.get('_study'));
        controller.set('child', this.get('_child'));
        controller.set('response', this.get('_response'));
        controller.set('pastResponses', this.get('_pastResponses'));
    }
});
