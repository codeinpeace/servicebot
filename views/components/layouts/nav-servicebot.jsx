import React from 'react';
import cookie from 'react-cookie';
import {Link} from 'react-router';
import {Authorizer, isAuthorized} from "../utilities/authorizer.jsx";
import ModalInvoice from '../elements/modals/modal-invoice.jsx';
import {AdminEditingGear, AdminEditingSidebar}from "./admin-sidebar.jsx";
import {NavNotification} from "../pages/notifications.jsx";
import SideNav from '../layouts//side-nav.jsx';
import {AppMessage} from '../elements/app-message.jsx';
import ReactTooltip from 'react-tooltip';
import consume from "pluginbot-react/dist/consume"

import { connect } from "react-redux";
import '../../../public/js/bootstrap-3.3.7-dist/js/bootstrap.js';
import $ from "jquery";
let _ = require("lodash");

const AnonymousLinks = ({signUpEnabled}) => (
    <ul className="nav navbar-nav navbar-right">
        <li><Link to="login">Log In</Link></li>
        {signUpEnabled &&
        <li><Link to="signup">Sign up</Link></li>
        }
    </ul>
);

const getSignUpStatus = (state) => {
    if(!state.options || !state.options.allow_registration){
        return {signUpEnabled: true};
    }
    return {
        signUpEnabled: (state.options.allow_registration.value == "true")
    }
};

const VisibleAnonymousLinks = connect(getSignUpStatus)(AnonymousLinks);

class NavServiceBot extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            InvoiceModal: false,
            sidebar: false,
            systemOptions: this.props.options || {},
            editingMode: false,
            editingGear: false
        };

        this.onOpenInvoiceModal = this.onOpenInvoiceModal.bind(this);
        this.onClose = this.onClose.bind(this);
        this.getMenuItems = this.getMenuItems.bind(this);
        this.toggleEditingMode = this.toggleEditingMode.bind(this);
        this.toggleSideBar = this.toggleSideBar.bind(this);
        this.toggleOnEditingGear = this.toggleOnEditingGear.bind(this);
        this.toggleOffEditingGear = this.toggleOffEditingGear.bind(this);
        this.getLivemode = this.getLivemode.bind(this);
        this.getPluginItems = this.getPluginItems.bind(this);
        this.getLinkClass = this.getLinkClass.bind(this);

    }

    componentDidMount(){
        $(this.refs.dropdownToggle).dropdown();
        $(this.refs.dropdownToggle2).dropdown();
        $(this.refs.dropdownToggle3).dropdown();
    }

    componentDidUpdate(){
        $(this.refs.dropdownToggle).dropdown();
        $(this.refs.dropdownToggle2).dropdown();
        $(this.refs.dropdownToggle3).dropdown();
    }

    onOpenInvoiceModal(){
        this.setState({InvoiceModal: true});
    }

    onClose(){
        this.setState({InvoiceModal: false});
    }

    toggleEditingMode(){
        if(this.state.editingMode){
            this.setState({editingMode: false})
        }else{
            this.setState({editingMode: true})
        }
    }
    toggleOnEditingGear(){
        this.setState({editingGear: true})
    }
    toggleOffEditingGear(){
        this.setState({editingGear: false})
    }

    toggleSideBar(){
        let self = this;
        this.setState({sidebar: !this.state.sidebar}, function () {
            if(self.state.sidebar){
                document.body.classList.add('layout-collapsed');
            }else{
                document.body.classList.remove('layout-collapsed');
            }
        });
    }
    getPluginItems(icon = null){
        let self = this;
        let user = this.props.user;
        return this.props.services.routeDefinition && this.props.services.routeDefinition.reduce((acc, route, index) => {
            console.log("expected route path", route.path);
            if(route.isVisible(user)) {
                acc.push(<li><Link key={index} to={route.path} className={self.getLinkClass(route.path.split('/')[1], 'parent')}>{icon && <span className={`nav-icons icon-${icon}`}/>}{route.name}</Link></li>)
            }
            return acc;
        }, [])

    }

    getLinkClass(expectedPath, linkType) {
        let path = this.props.currentPath;
        if(_.isArray(expectedPath)){
            return _.includes(expectedPath, path.split('/')[1]) ? `nav-link-${linkType} active` : `nav-link-${linkType}`;
        }
        return path.split('/')[1] === expectedPath ? `nav-link-${linkType} active` : `nav-link-${linkType}`;
    }

    getMenuItems(style){

        //todo: do this dynamically somehow
        let linkGroupManage = ['manage-catalog', 'manage-categories', 'manage-users', 'manage-subscriptions'];
        let linkGroupSettings = ['stripe-settings', 'notification-templates', 'manage-permission', 'system-settings'];

        let getLinkClass = this.getLinkClass;

        if(isAuthorized({permissions: ["can_administrate", "can_manage"]})){
            return(
                <ul className="app-links">
                    <li>
                        <Link to="/dashboard" style={style} className={getLinkClass('dashboard', 'parent')}>
                            <span className="nav-icons icon-home"/>Dashboard
                        </Link>
                    </li>
                    <li className="app-dropdown">
                        <a className={getLinkClass(linkGroupManage, 'parent')} href="#"><span className="nav-icons icon-manage"/>Manage<span className="caret"/></a>
                        <ul className="app-dropdown">
                            <li><Link to="/manage-catalog/list" className={getLinkClass('manage-catalog', 'child')}>Manage Offerings</Link></li>
                            <li><Link to="/manage-categories" className={getLinkClass('manage-categories', 'child')}>Manage Categories</Link></li>
                            <li><Link to="/manage-users" className={getLinkClass('manage-users', 'child')}>Manage Users</Link></li>
                            <li><Link to="/manage-subscriptions" className={getLinkClass('manage-subscriptions', 'child')}>Manage Subscriptions</Link></li>
                        </ul>
                    </li>
                    <li className="app-dropdown">
                        <a className={getLinkClass(linkGroupSettings, 'parent')} href="#"><span className="nav-icons icon-settings"/>Settings<span className="caret"/></a>
                        <ul className="app-dropdown">
                            <li><Link to="/stripe-settings" className={getLinkClass('stripe-settings', 'child')}>Stripe Settings</Link></li>
                            <li><Link to="/notification-templates" className={getLinkClass('notification-templates', 'child')}>Email Settings</Link></li>
                            <li><Link to="/manage-permission" className={getLinkClass('manage-permission', 'child')}>Permission Settings</Link></li>
                            <li><Link to="/system-settings" className={getLinkClass('system-settings', 'child')}>System Settings</Link></li>
                        </ul>
                    </li>
                    {this.getPluginItems('integrations')}
                </ul>
            )
        }else{
            return(
                <ul className="app-links">
                    <li><Link to="/my-services" style={style}>My Account<span className="sr-only">(current)</span></Link></li>
                    <li><Link to={`/billing-history/${this.props.uid}`}>Billing History</Link></li>
                    <li><Link to={`/billing-settings/${this.props.uid}`}>Payment Method</Link></li>
                    {this.getPluginItems()}
                </ul>
            )
        }
    }

    getLivemode(){
        let pk = cookie.load("spk")
        let livemode =  pk ? pk.substring(3, 7) : "";
        if(pk === undefined){
            return (
                <span data-tip data-for="notification-stripe-keys" className="notification-badge">
                    <Link to="/stripe-settings">
                        <ReactTooltip id="notification-stripe-keys" class="notification-stripe-keys"
                                      aria-haspopup='true' role='example'
                                      place="bottom" type="error" effect="solid" offset={{top: -28, left: -20}}>
                            <p><strong>You need to complete your setup to unlock certain features:</strong></p>
                                <ul>
                                    <li>User Invites</li>
                                    <li>Publishing Service Templates</li>
                                    <li>Adding funds</li>
                                    <li>Receiving Payments</li>
                                </ul>
                            <p>Click to complete</p>
                        </ReactTooltip>
                        <strong>Setup not complete</strong>
                    </Link>

                </span> );
        }
        if(livemode.toUpperCase() === "TEST") {
            return ( <span className="notification-badge"><strong>Test Mode</strong></span> );
        } else {
            return <span/>;
        }
    }

    render () {
        let self = this;
        const currentModal = ()=> {
            if(self.state.InvoiceModal){
                return(
                    <ModalInvoice show={self.state.InvoiceModal} icon="fa-credit-card" hide={self.onClose}/>
                );
            }
        };

        let navigationBarStyle = {};
        let linkTextStyle = {};
        if(this.props.options){
            let options = this.props.options;
            navigationBarStyle.backgroundColor = _.get(options, 'primary_theme_background_color.value', '#000000');
            linkTextStyle.color = _.get(options, 'primary_theme_text_color.value', '#000000');
        }

        let embed = false;
        if(window.location.search.substring(1) === 'embed'){
            embed = true;
        }

        if(!embed){
            return(
                <div className="app-layout">
                    <div className="app-header">
                        <div className="app-header-left">
                            <Link to="/">
                                <img className="app-logo" src="/api/v1/system-options/file/brand_logo"/>
                            </Link>
                        </div>
                        <div className="app-header-right">
                            <Authorizer>
                                <button className="buttons rounded" onClick={this.props.handleLogout}>Log Out</button>
                            </Authorizer>
                            <div className="app-profile">
                                <Link to="/profile">
                                    <img className="img-circle" src={`/api/v1/users/${this.props.uid}/avatar`}
                                         ref="avatar" alt="profile image"/>
                                    { this.state.loadingImage && <Load/> }
                                </Link>
                            </div>
                            <NavNotification/>
                        </div>
                    </div>
                    <div className="app-navigation">
                        <nav className="app-links-container" onMouseEnter={this.toggleOnEditingGear} onMouseLeave={this.toggleOffEditingGear}>

                            {/*<div className="navbar-header">*/}
                                {/*<Authorizer anonymous={true}>*/}
                                    {/*<Link className="mobile-login-button" to="/login">Login</Link>*/}
                                {/*</Authorizer>*/}
                                {/*<Authorizer>*/}
                                    {/*<button type="button" className="navbar-toggle collapsed" data-toggle="collapse"*/}
                                            {/*data-target="#bs-example-navbar-collapse-1" aria-expanded="false" onClick={this.toggleSideBar}  >*/}
                                        {/*<span className="sr-only">Toggle navigation</span>*/}
                                        {/*<span className="icon-bar"/>*/}
                                        {/*<span className="icon-bar"/>*/}
                                        {/*<span className="icon-bar"/>*/}
                                    {/*</button>*/}
                                {/*</Authorizer>*/}
                                {/*<span className="moble-live-mode">{this.getLivemode()}</span>*/}
                            {/*</div>*/}

                            <div className="">
                                <Authorizer>
                                    {this.getMenuItems(linkTextStyle)}
                                </Authorizer>
                                <div className="nav navbar-nav navbar-right navvbar-badge">
                                    {this.getLivemode()}
                                </div>
                                <Authorizer anonymous={true}>
                                    <VisibleAnonymousLinks/>
                                </Authorizer>
                                <Authorizer>
                                    <ul className="nav navbar-nav navbar-right">

                                    </ul>
                                </Authorizer>
                            </div>

                            {/* app-wide modals */}
                            {currentModal()}
                            {this.state.editingGear && <AdminEditingGear toggle={this.toggleEditingMode}/>}
                            {this.state.editingMode && <AdminEditingSidebar toggle={this.toggleEditingMode}
                                                                            filter = {[ "brand_logo",
                                                                                "primary_theme_background_color",
                                                                                "primary_theme_text_color",
                                                                                "button_primary_color",
                                                                                "button_primary_hover_color",
                                                                                "button_primary_text_color"]
                                                                            }/>
                            }
                            <AppMessage/>
                        </nav>
                        <SideNav sidebarLogout={this.props.handleLogout} toggleSidebar={this.toggleSideBar}/>
                    </div>
                </div>
            );
        }else{
            return null;
        }
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        uid: state.uid,
        user: state.user || null,
        options: state.options,
        nav_class: state.navbar.nav_class
    }
};

export default consume("routeDefinition")(connect(mapStateToProps)(NavServiceBot));