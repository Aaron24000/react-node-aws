import dynamic from 'next/dynamic';
import Layout from '../../../components/Layout';
import withAdmin from '../../withAdmin';
import { useState, useEffect } from 'react';
import {API} from '../../../config';
import axios from 'axios';
import {showErrorMessage, showSuccessMessage} from '../../../helpers/alert';
import Resizer from 'react-image-file-resizer';
const ReactQuill = dynamic(() => import('react-quill'), {ssr: false});
import 'react-quill/dist/quill.bubble.css';


const Update = ({ oldCategory, token }) => {
    const [state, setState] = useState({
        name: oldCategory.name,
        error: '',
        success: '',
        buttonText: 'Update',
        imagePreview: oldCategory.image.url,
        image: ''
    });

    const [content, setContent] = useState(oldCategory.content);
    const [imageUploadButtonName, setImageUploadButtonName] = useState('Upload image');

    const {name, error, success, image, buttonText, imageUploadText, imagePreview} = state;

    const handleChange = (name) => (e) => {
      setState({
        ...state,
        [name]: event.target.value,
        error: "",
        success: "",
        image:''
      });
    };

    const handleContent = e => {
      setContent(e);
      setState({
        ...state,
        success: '',
        error: ''
      })
    }

    const handleImage = e => {
      let fileInput = false;
      if (e.target.files[0]) {
        fileInput = true;
      }
      setImageUploadButtonName(event.target.files[0].name);
      if(fileInput) {
        Resizer.imageFileResizer(
          event.target.files[0],
          300,
          300,
          'JPEG',
          100,
          0,
          uri => {
            // console.log(uri)
            setState({
              ...state,
              image: uri,
              success: '',
              error: ''
            })
          },
          'base64'
        );
      }
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      setState({
        ...state,
        buttonText: "Updating...",
      });
    //   console.log(...formData);
    try {
        const response = await axios.put(`${API}/category/${oldCategory.slug}`, {name, content, image}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log(response);
        setImageUploadButtonName('Update image');
        setContent('');
        setState({
            ...state,
            name: '',
            formData: '',
            buttonText: 'Updated.',
            imageUploadText: 'Update image',
            success: `${response.data.name} is updated`
        })
    } catch (error) {
        console.log('CATEGORY CREATE ERROR', error);
        setState({
            ...state,
            name: '',
            buttonText: 'Updating',
            error: error.response.data.error
        })
    }
    };

    const updateCategoryForm = () => {
        return (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="text-muted">Name</label>
              <input
                onChange={handleChange("name")}
                value={name}
                type="text"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="text-muted">Content</label>
              {/* <textarea
                onChange={handleChange("content")}
                value={content}
                className="form-control"
                required
              /> */}
              <ReactQuill
              theme="bubble"
              value={content}
              onChange={handleContent}
              placeholder="Write something..."
              className="pb-5 mb-3"
              style={{border: '1px solid #666' }}
              />
            </div>
            <div className="form-group">
              <label className="btn btn-outline-secondary">
                {imageUploadButtonName} {' '}
                <span>
                    <img src={imagePreview} alt="image" height="20px"></img>
                </span>
                <input
                  onChange={handleImage}
                  type="file"
                  accept="image/*"
                  className="form-control"
                  hidden
                />
              </label>
            </div>
            <div>
              <button className="btn btn-outline-warning">{buttonText}</button>
            </div>
          </form>
        );
    }

    return (
        <Layout>
            <div className="row">
                <div className="col-md-6 offset-md-3">
                    <h1>Update category</h1>
                    <br/>
                    {success && showSuccessMessage(success)}
                    {error && showErrorMessage(error)}
                    {updateCategoryForm()}
                </div>
            </div>
        </Layout>
    )
}

Update.getInitialProps =  async ({req, query, token}) => {
    const response = await axios.post(`${API}/category/${query.slug}`);
    return {oldCategory: response.data.category, token}
}

export default withAdmin(Update);