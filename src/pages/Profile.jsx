import { useEffect, useState } from "react"
import { getAuth, updateProfile } from "firebase/auth"
import {
	updateDoc,
	doc,
	collection,
	getDocs,
	query,
	where,
	orderBy,
	deleteDoc,
} from "firebase/firestore"
import { db } from "../firebase.config"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "react-toastify"
import arrowRight from "../assets/svg/keyboardArrowRightIcon.svg"
import homeIcon from "../assets/svg/homeIcon.svg"
import Spinner from "../components/Spinner"
import ListingItem from "../components/ListingItem"

function Profile() {
	const auth = getAuth()
	const [listings, setListings] = useState(null)
	const [loading, setLoading] = useState(true)
	const [changeDetails, setChangeDetails] = useState(false)
	const [formData, setFormData] = useState({
		name: auth.currentUser.displayName,
		email: auth.currentUser.email,
	})

	const { name, email } = formData

	const navigate = useNavigate()

	useEffect(() => {
		const fetchUserListings = async () => {
			const listingsRef = collection(db, "listings")
			const q = query(
				listingsRef,
				where("userRef", "==", auth.currentUser.uid),
				orderBy("timestamp", "desc")
			)

			const querySnap = await getDocs(q)

			const listings = []

			querySnap.forEach((doc) => {
				return listings.push({
					id: doc.id,
					data: doc.data(),
				})
			})

			setListings(listings)
			setLoading(false)
		}
		fetchUserListings()
	}, [auth.currentUser.uid])

	const onLogout = () => {
		auth.signOut()
		navigate("/")
	}

	const onSubmit = () => {
		try {
			if (auth.currentUser.displayName !== name) {
				// Update display name in firebase
				updateProfile(auth.currentUser, {
					displayName: name,
				})

				// Update in firestore
				const userRef = doc(db, "users", auth.currentUser.uid)
				updateDoc(userRef, {
					name,
				}).then(() => {
					toast.success("Profile updated successfully")
				})
			}
		} catch (error) {
			toast.error("Could not update profile details")
		}
	}

	const onChange = (e) => {
		setFormData((prevState) => ({
			...prevState,
			[e.target.id]: e.target.value,
		}))
	}

	const onDelete = async (listingId) => {
		if (window.confirm("Are you sure you want to delete?")) {
			await deleteDoc(doc(db, "listings", listingId))
			const updatedListing = listings.filter(
				(listing) => listing.id !== listingId
			)
			setListings(updatedListing)
			toast.success('Successfully deleted listing')
		}
	}

	const onEdit = (listingId) => {
		navigate(`/edit-listing/${listingId}`)
	}

	if (loading) {
		return <Spinner />
	}

	return (
		<div className="profile">
			<header className="profileHeader">
				<p className="pageHeader">My Profile</p>
				<button className="logOut" type="button" onClick={onLogout}>
					Logout
				</button>
			</header>

			<main>
				<div className="profileDetailsHeader">
					<p className="profileDetailsText">Personal Details</p>
					<p
						className="changePersonalDetails"
						onClick={() => {
							changeDetails && onSubmit()
							setChangeDetails((prevState) => !prevState)
						}}
					>
						{changeDetails ? "done" : "change"}
					</p>
				</div>

				<div className="profileCard">
					<form>
						<input
							type="text"
							id="name"
							className={!changeDetails ? "profileName" : "profileNameActive"}
							disabled={!changeDetails}
							value={name}
							onChange={onChange}
						/>
						<input
							type="text"
							id="email"
							className="profileEmail"
							disabled={true}
							value={email}
						/>
					</form>
				</div>

				<Link to="/create-listing" className="createListing">
					<img src={homeIcon} alt="home" />
					<p>Sell or rent your home</p>
					<img src={arrowRight} alt="arrow right" />
				</Link>

				{!loading && listings?.length > 0 && (
					<>
						<p className="listingText">Your Listings</p>
						<ul className="listingsList">
							{listings.map((listing) => (
								<ListingItem
									key={listing.id}
									listing={listing.data}
									id={listing.id}
									onDelete={() => onDelete(listing.id)}
									onEdit={() => onEdit(listing.id)}
								/>
							))}
						</ul>
					</>
				)}
			</main>
		</div>
	)
}

export default Profile
